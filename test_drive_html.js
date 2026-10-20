const fetch = globalThis.fetch;

async function test(id) {
  try {
    const r = await fetch('https://drive.google.com/drive/folders/' + id);
    const html = await r.text();
    const regex = /"([^"]+\.(?:jpg|jpeg|png|pdf|tex|csv))"/gi;
    const found = new Set();
    let m;
    while ((m = regex.exec(html)) !== null) {
      found.add(m[1]);
    }
    console.log(id, '->', Array.from(found));
    
    // Procura também por nomes de subpastas ou pastas
    const subfolderMatches = html.match(/Fotos da Resid[^"]*|Fotos do Medidor[^"]*/gi);
    console.log(id, 'subfolders ->', subfolderMatches ? Array.from(new Set(subfolderMatches)) : 'none');
  } catch (e) {
    console.error(id, e);
  }
}

async function run() {
  await test('1-hW9lhDoBmkod-_RVmUF4mqjNe6phq3J');
  await test('1bi1MVbYBBlYC83NBwYQ7wHoV-E9SpOhQ');
  await test('1lbtR2mA3EoF1HA1zMzW0hhSDMhj-_st1');
  await test('1FrS-r1RTOgUPRqr7FFLU-fNvn2Ozu4JS');
}
run();
