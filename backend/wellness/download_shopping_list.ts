import { api } from "encore.dev/api";

export interface DownloadShoppingListRequest {
  shoppingListData: any;
  format: "pdf" | "csv";
}

export interface DownloadResponse {
  content: string;
  filename: string;
  contentType: string;
}

export const downloadShoppingList = api<DownloadShoppingListRequest, DownloadResponse>(
  { method: "POST", path: "/wellness/shopping-lists/download", expose: true },
  async (req) => {
    if (req.format === "csv") {
      const csv = generateShoppingListCSV(req.shoppingListData);
      return {
        content: csv,
        filename: `shopping-list-${new Date().toISOString().split('T')[0]}.csv`,
        contentType: "text/csv"
      };
    } else {
      const html = generateShoppingListHTML(req.shoppingListData);
      return {
        content: html,
        filename: `shopping-list-${new Date().toISOString().split('T')[0]}.html`,
        contentType: "text/html"
      };
    }
  }
);

function generateShoppingListCSV(shoppingList: any): string {
  let csv = "Category,Item,Quantity,Notes\n";
  
  for (const [category, items] of Object.entries(shoppingList.items || {})) {
    const itemsList = items as any[];
    for (const item of itemsList) {
      csv += `${category},"${item.name}","${item.quantity || ''}","${item.notes || ''}"\n`;
    }
  }
  
  return csv;
}

function generateShoppingListHTML(shoppingList: any): string {
  const categories = Object.keys(shoppingList.items || {});
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Shopping List</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
    .category { margin-bottom: 25px; page-break-inside: avoid; }
    .category h2 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
    .items { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .checkbox { width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px; margin-right: 12px; }
    .item-name { flex: 1; font-weight: 500; }
    .item-quantity { color: #6b7280; margin-right: 10px; }
    .item-notes { color: #9ca3af; font-size: 14px; font-style: italic; }
    @media print { .category { page-break-after: auto; } }
  </style>
</head>
<body>
  <h1>Shopping List</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
`;

  for (const category of categories) {
    const items = shoppingList.items[category] || [];
    html += `
  <div class="category">
    <h2>${category}</h2>
    <div class="items">
`;
    
    for (const item of items) {
      html += `
      <div class="item">
        <div class="checkbox"></div>
        <span class="item-name">${item.name}</span>
        ${item.quantity ? `<span class="item-quantity">${item.quantity}</span>` : ''}
        ${item.notes ? `<span class="item-notes">${item.notes}</span>` : ''}
      </div>
`;
    }
    
    html += `
    </div>
  </div>
`;
  }

  html += `
</body>
</html>
`;
  
  return html;
}
