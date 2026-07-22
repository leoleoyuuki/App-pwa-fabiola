import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage setup to preserve original file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors()); // Enable CORS for testing from client side PWA
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook mock receiver
app.post('/webhook', upload.fields([
  { name: 'photosImovel', maxCount: 10 },
  { name: 'photosMedidor', maxCount: 10 }
]), (req, res) => {
  console.log('\n=========================================');
  console.log('📬 NOVO LAUDO DE CONSUMO RECEBIDO!');
  console.log('=========================================');
  console.log('📋 DADOS DO RELATÓRIO:');
  console.log(`   ID: ${req.body.id}`);
  console.log(`   Data de Criação: ${req.body.createdAt}`);
  console.log(`   Nome do Autor: ${req.body.nomeAutor || 'Não especificado'}`);
  console.log(`   Número do Processo: ${req.body.numeroProcesso || 'Não especificado'}`);
  console.log(`   Réu / Concessionária: ${req.body.reuConcessionaria || 'Não especificado'}`);
  console.log(`   Tipo de Ação: ${req.body.tipoAcao || 'Não especificado'}`);
  console.log(`   Data da Vistoria: ${req.body.dataVistoria || 'Não especificado'}`);
  console.log(`   Nº da Vistoria: ${req.body.numeroVistoria || 'Não especificado'}`);
  console.log(`   Período: ${req.body.periodoVistoria || 'Não especificado'}`);
  console.log(`   Número do Medidor: ${req.body.numeroMedidor || 'Não especificado'}`);
  console.log(`   Checklist: ${req.body.checklist || 'Nenhum item selecionado'}`);
  console.log(`   Observações Finais: ${req.body.observacoesFinais || 'Sem observações'}`);
  
  const filesImovel = req.files && req.files['photosImovel'] ? req.files['photosImovel'] : [];
  const filesMedidor = req.files && req.files['photosMedidor'] ? req.files['photosMedidor'] : [];
  
  if (filesImovel.length > 0 || filesMedidor.length > 0) {
    console.log('\n📷 IMAGENS EM ALTA RESOLUÇÃO SALVAS:');
    
    if (filesImovel.length > 0) {
      console.log(`   [Fotos do Imóvel - ${filesImovel.length} arquivo(s)]:`);
      filesImovel.forEach((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`      (${index + 1}) ${file.originalname} (${sizeMB} MB) -> uploads/${file.filename}`);
      });
    }
    
    if (filesMedidor.length > 0) {
      console.log(`   [Fotos do Medidor - ${filesMedidor.length} arquivo(s)]:`);
      filesMedidor.forEach((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`      (${index + 1}) ${file.originalname} (${sizeMB} MB) -> uploads/${file.filename}`);
      });
    }
  } else {
    console.log('\n📷 Nenhuma imagem recebida.');
  }
  console.log('=========================================\n');

  res.status(200).json({ 
    success: true, 
    message: 'Laudo de consumo recebido com sucesso no servidor local!' 
  });
});

const PORT = 3000;
// Listen on 0.0.0.0 to allow network connections from mobile phones
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de testes rodando em:`);
  console.log(`   Local:   http://localhost:${PORT}/webhook`);
  console.log(`   Rede:    http://192.168.15.13:${PORT}/webhook`);
  console.log(`\nCole o link de "Rede" nas configurações de webhook do PWA para testar!`);
});
