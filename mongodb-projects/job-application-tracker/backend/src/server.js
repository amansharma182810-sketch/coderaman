import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

const applicationSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Applied','Screening','Interview','Offer','Rejected'], default: 'Applied' },
  appliedAt: { type: Date, default: Date.now },
  notes: String,
  followUpAt: Date
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);
app.get('/api/health', (_req,res)=>res.json({ok:true,service:'job-tracker'}));
app.get('/api/applications', async (_req,res)=>res.json(await Application.find().sort({updatedAt:-1})));
app.post('/api/applications', async (req,res)=>{try{const item=await Application.create(req.body);res.status(201).json(item)}catch(e){res.status(400).json({error:e.message})}});
app.patch('/api/applications/:id', async (req,res)=>{try{const item=await Application.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});res.json(item)}catch(e){res.status(400).json({error:e.message})}});
app.delete('/api/applications/:id', async (req,res)=>{await Application.findByIdAndDelete(req.params.id);res.status(204).end()});

const port=Number(process.env.PORT||5002);
mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/job_tracker').then(()=>app.listen(port,()=>console.log(`Job Tracker API: ${port}`))).catch(e=>{console.error(e);process.exit(1)});
