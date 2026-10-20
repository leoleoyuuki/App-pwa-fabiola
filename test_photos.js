const fetch = globalThis.fetch;

async function run() {
  const r = await fetch('https://script.google.com/macros/s/AKfycbyZJM6rSwBr3BKD_LawYeeRUoynUhQIol4GILJnnCYiMCCzD4B2-JfXFjJCwe2rC4Q5/exec?perito=rodrigues.periciajud@gmail.com');
  const data = await r.json();
  console.log("Total laudos:", data.length);
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const item = data[i];
    const folder = item['Link da Pasta (Google Drive)'];
    const proc = item['Número do Processo'];
    const autor = item['Nome do Autor'];
    if (!folder) continue;
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbyZJM6rSwBr3BKD_LawYeeRUoynUhQIol4GILJnnCYiMCCzD4B2-JfXFjJCwe2rC4Q5/exec?action=getdrivephotos&folderUrl=' + encodeURIComponent(folder));
      const json = await res.json();
      console.log(`[${i}] ${autor} (${proc}) -> Imovel: ${json.photosImovel?.length || 0}, Medidor: ${json.photosMedidor?.length || 0}`);
    } catch (e) {
      console.log(`[${i}] erro:`, e.message);
    }
  }
}
run();
