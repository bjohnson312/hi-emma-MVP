import { useState } from "react";
import { Camera, Refrigerator, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";

interface FoodImageUploadProps {
  userId: string;
  imageType: "meal" | "refrigerator";
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  onAnalysisComplete: (data: any) => void;
}

export default function FoodImageUpload({ 
  userId, 
  imageType, 
  mealType,
  onAnalysisComplete 
}: FoodImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageId, setImageId] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      const uploadResponse = await backend.wellness.uploadFoodImage({
        user_id: userId,
        image_type: imageType,
        meal_type: mealType
      });

      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await fetch(uploadResponse.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });

      if (!uploadResult.ok) {
        throw new Error("Upload failed");
      }

      setImageId(uploadResponse.image_id);
      setUploading(false);
      setAnalyzing(true);

      const analysisResponse = await backend.wellness.analyzeFoodImage({
        user_id: userId,
        image_id: uploadResponse.image_id,
        image_type: imageType,
        meal_type: mealType
      });

      setAnalyzing(false);

      toast({
        title: "Success",
        description: imageType === "meal" 
          ? "Meal analyzed and logged successfully!" 
          : "Refrigerator scanned successfully!",
        duration: 3000
      });

      onAnalysisComplete(analysisResponse);

    } catch (error) {
      console.error("Failed to upload and analyze image:", error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive"
      });
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const isProcessing = uploading || analyzing;

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        id={`food-image-upload-${imageType}`}
        disabled={isProcessing}
      />
      <label htmlFor={`food-image-upload-${imageType}`}>
        <Button
          type="button"
          disabled={isProcessing}
          className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white w-full cursor-pointer"
          asChild
        >
          <div className="flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? "Uploading..." : "Analyzing..."}
              </>
            ) : imageType === "meal" ? (
              <>
                <Camera className="w-4 h-4" />
                Take Photo of Meal
              </>
            ) : (
              <>
                <Refrigerator className="w-4 h-4" />
                Scan Refrigerator
              </>
            )}
          </div>
        </Button>
      </label>
    </div>
  );
}
