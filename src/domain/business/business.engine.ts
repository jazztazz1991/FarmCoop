import type { BusinessType } from "./business.model";

const BUSINESS_TYPE_FOR_CAREER: Record<string, BusinessType> = {
  banker: "bank",
  dealer: "dealership",
  inspector: "insurance",
  trucker: "trucking",
};

const CAREER_FOR_BUSINESS_TYPE: Record<BusinessType, string> = {
  bank: "banker",
  dealership: "dealer",
  insurance: "inspector",
  trucking: "trucker",
};

/**
 * Check if a user's career allows them to create a specific business type.
 */
export function canCreateBusiness(career: string, type: BusinessType): boolean {
  return BUSINESS_TYPE_FOR_CAREER[career] === type;
}

/**
 * Get the required career for a business type.
 */
export function getCareerForBusinessType(type: BusinessType): string {
  return CAREER_FOR_BUSINESS_TYPE[type];
}

/**
 * Get the business type a career can create (if any).
 */
export function getBusinessTypeForCareer(career: string): BusinessType | null {
  return BUSINESS_TYPE_FOR_CAREER[career] ?? null;
}
