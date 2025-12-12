

export interface StepData {
  stepNumber: number; 
  userId?: string; 
  answers: Record<string, any>; 
  timestamp: Date; 
  completed: boolean; 
}

export interface Step1Data extends StepData {
  stepNumber: 1;
  answers: {
    
    started?: boolean; 
    hasAccount?: boolean; 
    
  };
}

export type AllStepsData = Step1Data; 

