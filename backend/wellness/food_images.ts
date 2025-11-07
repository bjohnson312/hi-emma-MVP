import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Bucket } from "encore.dev/storage/objects";
import db from "../db";
import type { 
  UploadFoodImageRequest, 
  UploadFoodImageResponse,
  AnalyzeFoodImageRequest,
  AnalyzeFoodImageResponse,
  MealNutritionData,
  RefrigeratorScanData
} from "./types";

const openAIKey = secret("OpenAIKey");
const foodImages = new Bucket("food-images", { public: false });

export const uploadFoodImage = api<UploadFoodImageRequest, UploadFoodImageResponse>(
  { expose: true, method: "POST", path: "/wellness/food-image/upload" },
  async (req) => {
    const imageId = `${req.user_id}_${req.image_type}_${Date.now()}`;
    const imageName = `${imageId}.jpg`;
    
    const { url } = await foodImages.signedUploadUrl(imageName, {
      ttl: 3600
    });

    return {
      upload_url: url,
      image_id: imageId
    };
  }
);

export const analyzeFoodImage = api<AnalyzeFoodImageRequest, AnalyzeFoodImageResponse>(
  { expose: true, method: "POST", path: "/wellness/food-image/analyze" },
  async (req) => {
    const imageName = `${req.image_id}.jpg`;
    
    const { url: downloadUrl } = await foodImages.signedDownloadUrl(imageName, {
      ttl: 3600
    });

    if (req.image_type === "meal") {
      const mealData = await analyzeMealImage(downloadUrl, req.meal_type);
      
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO diet_nutrition_logs 
          (user_id, meal_type, description, calories, protein_g, carbs_g, fat_g, fiber_g, 
           image_url, analyzed, meal_time)
        VALUES 
          (${req.user_id}, ${req.meal_type || "snack"}, ${mealData.description}, 
           ${mealData.calories || null}, ${mealData.protein_g || null}, 
           ${mealData.carbs_g || null}, ${mealData.fat_g || null}, 
           ${mealData.fiber_g || null}, ${downloadUrl}, true, NOW())
        RETURNING id
      `;

      return {
        meal_data: mealData,
        image_url: downloadUrl
      };
    } else {
      const refrigeratorData = await analyzeRefrigeratorImage(downloadUrl, req.user_id);
      
      await db.exec`
        INSERT INTO refrigerator_scans 
          (user_id, image_url, detected_items, suggested_meals)
        VALUES 
          (${req.user_id}, ${downloadUrl}, ${refrigeratorData.detected_items}, 
           ${JSON.stringify(refrigeratorData.suggested_meals)})
      `;

      return {
        refrigerator_data: refrigeratorData,
        image_url: downloadUrl
      };
    }
  }
);

async function analyzeMealImage(imageUrl: string, mealType?: string): Promise<MealNutritionData> {
  const prompt = `Analyze this food image and provide detailed nutrition information. 

Return a JSON object with this exact structure:
{
  "description": "Brief description of the meal",
  "calories": estimated total calories (number),
  "protein_g": estimated protein in grams (number),
  "carbs_g": estimated carbohydrates in grams (number),
  "fat_g": estimated fat in grams (number),
  "fiber_g": estimated fiber in grams (number),
  "items": ["item1", "item2", "item3"] (list of food items visible)
}

Be as accurate as possible with nutrition estimates based on visible portions.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    description: "Unable to analyze meal",
    items: []
  };
}

async function analyzeRefrigeratorImage(imageUrl: string, userId: string): Promise<RefrigeratorScanData> {
  const planResult = await db.queryRow<{ dietary_preferences: string, goals: string[] }>`
    SELECT dietary_preferences, goals
    FROM nutrition_plans
    WHERE user_id = ${userId} AND active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const dietaryInfo = planResult 
    ? `User dietary preferences: ${planResult.dietary_preferences}. Goals: ${planResult.goals?.join(", ")}.`
    : "";

  const prompt = `Analyze this refrigerator/pantry image and help plan meals.

${dietaryInfo}

Return a JSON object with this exact structure:
{
  "detected_items": ["item1", "item2", "item3", ...] (list all visible food items),
  "suggested_meals": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "ingredients": ["ingredient1", "ingredient2"],
      "estimated_prep_time": "20 minutes"
    },
    ... (suggest 3-5 meals)
  ]
}

Base meal suggestions on the available ingredients and consider the user's dietary preferences if provided.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1500
    })
  });

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    detected_items: [],
    suggested_meals: []
  };
}

interface GetRefrigeratorScansRequest {
  user_id: string;
  limit?: number;
}

interface RefrigeratorScan {
  id: number;
  user_id: string;
  image_url: string;
  detected_items: string[];
  suggested_meals: any;
  scan_date: Date;
  created_at: Date;
}

interface GetRefrigeratorScansResponse {
  scans: RefrigeratorScan[];
}

export const getRefrigeratorScans = api<GetRefrigeratorScansRequest, GetRefrigeratorScansResponse>(
  { expose: true, method: "GET", path: "/wellness/refrigerator-scans/:user_id" },
  async (req) => {
    const limit = req.limit || 10;
    
    const scans = await db.queryAll<RefrigeratorScan>`
      SELECT id, user_id, image_url, detected_items, suggested_meals, 
             scan_date, created_at
      FROM refrigerator_scans
      WHERE user_id = ${req.user_id}
      ORDER BY scan_date DESC
      LIMIT ${limit}
    `;

    return { scans };
  }
);
