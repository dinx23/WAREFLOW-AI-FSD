import mongoose from 'mongoose';
const { Schema }=mongoose;

const inventorySchema=new Schema({
  sku:{type:String,required:true},name:{type:String,required:true},qty:{type:Number,required:true,min:0},
  reorderPoint:{type:Number,required:true,min:0},bin:{type:String,required:true},movement:{type:String,default:'Medium'},
  avgDailyDemand:{type:Number,default:1,min:0},leadTimeDays:{type:Number,default:3,min:0},category:{type:String,default:'General'},updatedAt:{type:Date,default:Date.now},
},{timestamps:true});
inventorySchema.index({sku:1},{unique:true});

const binRecommendationSchema=new Schema({
  key:{type:String,required:true,index:true},sku:{type:String,required:true},name:String,from:String,to:String,picksPerWeek:Number,
  distanceReduction:Number,priority:String,status:{type:String,default:'Pending'},reason:String,approvedBy:String,approvedAt:Date,
},{timestamps:true});

const securityAlertSchema=new Schema({
  key:{type:String,required:true,index:true},type:String,severity:String,resource:String,user:String,oldValue:String,newValue:String,time:String,
  status:{type:String,default:'Open'},description:String,reviewedBy:String,reviewedAt:Date,
},{timestamps:true});

const auditEventSchema=new Schema({
  actor:String,resource:String,action:String,before:String,after:String,source:String,createdAt:{type:Date,default:Date.now},
});
auditEventSchema.index({resource:1,createdAt:-1});

export const InventoryItem=mongoose.models.InventoryItem||mongoose.model('InventoryItem',inventorySchema);
export const BinRecommendation=mongoose.models.BinRecommendation||mongoose.model('BinRecommendation',binRecommendationSchema);
export const SecurityAlert=mongoose.models.SecurityAlert||mongoose.model('SecurityAlert',securityAlertSchema);
export const AuditEvent=mongoose.models.AuditEvent||mongoose.model('AuditEvent',auditEventSchema);
