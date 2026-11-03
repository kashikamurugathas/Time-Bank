export type AccountType = 'INDIVIDUAL' | 'COMMUNITY' | 'ORGANIZATION';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | 'COMMUNITY_LEADER' | 'ORG_MANAGER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roleId: UserRole;
  accountType: AccountType;
  status: UserStatus;
  phoneNumber?: string;
  bio?: string;
  country?: string;
  district?: string;
  city?: string;
  profilePhotoUrl?: string;
  membershipTier?: 'FREE' | 'PREMIUM';
  ratingAvg?: number;
  ratingCount?: number;
  completedServicesCount?: number;
  requiresPasswordChange?: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  searchRadiusKm?: number;
  availableCredits?: number;
  earnedCredits?: number;
  spentCredits?: number;
  pendingCredits?: number;
  skills?: UserSkill[];
  learningJourney?: LearningRecord[];
  unreadNotifications?: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive?: number;
}

export interface UserSkill {
  id: string;
  skillId?: string;
  skillName?: string;
  category?: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  description?: string;
  hourlyRateCredits?: number;
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  preferredLocations?: string;
  workSamples?: string;
  isVerified?: number;
}

export interface LearningRecord {
  id: string;
  skillName: string;
  category: string;
  status: 'CURRENTLY_LEARNING' | 'NEWLY_ACQUIRED' | 'VERIFIED';
  progressPercentage: number;
  description?: string;
  learningInstitution?: string;
  completionDate?: string;
  certificateUrl?: string;
  projectImageUrl?: string;
  workSamples?: string;
  isVerifiedByAdmin?: number;
  createdAt?: string;
}

export interface HelperRecommendation {
  userId: string;
  fullName: string;
  accountType: AccountType;
  bio?: string;
  country: string;
  district: string;
  city: string;
  profilePhotoUrl?: string;
  membershipTier: 'FREE' | 'PREMIUM';
  ratingAvg: number;
  ratingCount: number;
  completedServicesCount: number;
  distanceKm: number;
  approximateDistanceDisplay: string;
  skills: Array<{
    userSkillId: string;
    skillId: string;
    skillName: string;
    category: string;
    experienceLevel: string;
    description?: string;
    hourlyRateCredits: number;
  }>;
}

export interface HelpRequest {
  id: string;
  requester_id: string;
  title: string;
  category: string;
  skill_id?: string;
  skill_name: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  duration_hours: number;
  credits_offered: number;
  location_name: string;
  latitude?: number;
  longitude?: number;
  status: 'OPEN' | 'PENDING_RESPONSE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  created_at: string;
  requester_name?: string;
  requester_photo?: string;
  requester_city?: string;
  requester_district?: string;
  requester_rating?: number;
  response_count?: number;
  responses?: HelpResponse[];
}

export interface HelpResponse {
  id: string;
  request_id: string;
  helper_id: string;
  proposed_date?: string;
  proposed_time?: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  created_at: string;
  helper_name?: string;
  helper_photo?: string;
  helper_city?: string;
  helper_rating?: number;
}

export interface Booking {
  id: string;
  booking_code: string;
  request_id?: string;
  requester_id: string;
  helper_id: string;
  skill_name: string;
  service_date: string;
  service_time: string;
  duration_hours: number;
  credit_amount: number;
  location_name: string;
  status: 'PENDING' | 'CONFIRMED' | 'RESCHEDULE_REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requester_confirmed_completion: number;
  helper_confirmed_completion: number;
  reschedule_proposed_date?: string;
  reschedule_proposed_time?: string;
  reschedule_reason?: string;
  cancellation_reason?: string;
  created_at: string;
  requester_name?: string;
  requester_photo?: string;
  requester_phone?: string;
  helper_name?: string;
  helper_photo?: string;
  helper_phone?: string;
  review_id?: string;
  review_rating?: number;
  review_comment?: string;
  history?: Array<{
    id: string;
    action: string;
    actor_id: string;
    actor_name?: string;
    notes?: string;
    created_at: string;
  }>;
}

export interface TimeTransaction {
  id: string;
  reference_no: string;
  from_user_id?: string;
  from_name?: string;
  to_user_id?: string;
  to_name?: string;
  amount_credits: number;
  transaction_type: 'TRANSFER' | 'EARNED' | 'SPENT' | 'HOLD' | 'REFUND' | 'BONUS' | 'ADMIN_ADJUSTMENT';
  related_booking_id?: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  partner_id: string;
  partner_name: string;
  partner_photo?: string;
  partner_city?: string;
  last_message_preview?: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: number;
  read_at?: string;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'REGISTRATION' | 'APPROVAL' | 'HELP_REQUEST' | 'MESSAGE' | 'BOOKING' | 'CREDIT' | 'SUBSCRIPTION' | 'SYSTEM';
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  category: 'COMMUNITY' | 'ORGANIZATION' | 'PREMIUM_INDIVIDUAL';
  price_lkr: number;
  duration_days: number;
  features: string[];
  is_active: number;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  reviewer_photo?: string;
  skill_name?: string;
  created_at: string;
}
