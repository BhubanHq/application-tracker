import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { statuses, validateApplication } from '../shared/application.js';
const schema = new mongoose.Schema({
  company:{type:String,required:true,maxlength:120}, role:{type:String,required:true,maxlength:160},
  status:{type:String,enum:statuses,default:'Saved'}, url:{type:String,default:''},
  notes:{type:String,default:''}, followUp:{type:String,default:''}
}, {timestamps:true});
export const Application = mongoose.model('Application', schema);
export const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
app.get('/api/health', (req,res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({database:mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}));
app.get('/api/applications', async (req,res) => res.json(await Application.find().sort({updatedAt:-1}).lean()));
function validate(req,res,next) {
  try { req.application = validateApplication(req.body); next(); }
  catch(error) { res.status(400).json({error:error.message}); }
}
app.param('id', (req,res,next,id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({error:'Invalid application ID.'});
  next();
});
app.post('/api/applications', validate, async (req,res) => res.status(201).json(await Application.create(req.application)));
app.put('/api/applications/:id', validate, async (req,res) => {
  const item = await Application.findByIdAndUpdate(req.params.id, req.application, {new:true,runValidators:true});
  if (!item) return res.status(404).json({error:'Application not found.'});
  res.json(item);
});
app.delete('/api/applications/:id', async (req,res) => {
  const item = await Application.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({error:'Application not found.'});
  res.sendStatus(204);
});
app.use('/api', (req,res) => res.status(404).json({error:'API route not found.'}));
const dist = fileURLToPath(new URL('../dist', import.meta.url));
app.use(express.static(dist));
app.get('/{*path}', (req,res,next) => res.sendFile(path.join(dist,'index.html'), error => error && next(error)));
app.use((error,req,res,next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({error:'Invalid JSON body.'});
  if (error.type === 'entity.too.large') return res.status(413).json({error:'Request is too large.'});
  console.error(error.message);
  res.status(500).json({error:'Something went wrong. Please try again.'});
});
