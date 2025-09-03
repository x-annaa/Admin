// ======================
// 编辑产品信息
// ======================
async function editProduct(id, name, price, description, profit) {
  const newName = prompt("Enter new name:", name);
  if (newName === null) return;

  const newPrice = prompt("Enter new price:", price);
  if (newPrice === null || isNaN(newPrice)) return;

  const newDesc = prompt("Enter new description:", description);
  if (newDesc === null) return;

  const newProfit = prompt("Enter new profit:", profit);
  if (newProfit === null || isNaN(newProfit)) return;

  const { error } = await supabaseClient
    .from("products")
    .update({
      name: newName,
      price: parseFloat(newPrice),
      description: newDesc,
      profit: parseFloat(newProfit),
    })
    .eq("id", id);

  if (error) {
    alert("❌ Error updating product: " + error.message);
  } else {
    alert("✅ Product updated successfully!");
    loadProducts();
  }
}
