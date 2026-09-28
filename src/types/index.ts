export type ViewMode = 
  | 'home'
  | 'work'
  | 'process'
  | 'about'
  | 'pricing'
  | 'join-network'
  | 'privacy'
  | 'terms';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  headline: string;
  description: string;
  deliverables: string[];
  specialistProfiles: string[];
  idealFor: string;
}

export interface ProjectConcept {
  id: string;
  title: string;
  badge: 'Independent Concept' | 'Sample Project';
  category: string;
  shortDescription: string;
  servicesInvolved: string[];
  image: string;
  aspectRatio: string;
  overview: string;
  architectureDetails: string[];
  deliverables: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  clientExperience: string;
  yaawpAction: string;
}

export interface OperatingPrinciple {
  number: string;
  title: string;
  description: string;
  detail: string;
}

export interface ProjectInquiryData {
  name: string;
  email: string;
  company: string;
  service: string;
  budgetRange: string;
  timeline: string;
  projectDetails: string;
  agreedToPrivacy: boolean;
}

export interface SpecialistApplicationData {
  fullName: string;
  email: string;
  discipline: string;
  portfolioUrl: string;
  yearsOfExperience: string;
  weeklyAvailability: string;
  primarySkills: string;
  briefBio: string;
}
