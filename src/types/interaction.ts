export interface ApiResult<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

export interface InteractionSettings {
  commentsEnabled: boolean;
  likesEnabled: boolean;
  commentAudit: boolean;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  username?: string;
  avatar?: string;
  parentId?: number | null;
  replyToUsername?: string | null;
}

export interface CommentListResponse {
  list: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminComment extends Comment {
  postTitle: string;
  postSlug: string;
}

export interface AdminCommentListResponse {
  list: AdminComment[];
  total: number;
  page: number;
  limit: number;
}

export interface LikeStatus {
  count: number;
  liked: boolean;
}



export type MessageWallStyle = 'danmaku' | 'flipcard' | 'timetunnel';

export interface MessageWallSettings {
  enabled: boolean;
  allowAnonymous: boolean;
  auditEnabled: boolean;
  defaultStyle: MessageWallStyle;
  
  danmakuRepeatSec?: number;      
  danmakuTrackCount?: number;     
  danmakuSpeedMin?: number;       
  danmakuSpeedMax?: number;       
  danmakuIntervalMin?: number;    
  danmakuIntervalMax?: number;    
}

export interface Message {
  id: number;
  content: string;
  nickname?: string | null;
  userId: number | null;
  username?: string | null;
  avatar?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  list: Message[];
  total: number;
  page: number;
  limit: number;
}



export interface ChatSettings {
  enabled: boolean; 
  publicRoomEnabled: boolean; 
  allUsersRoomEnabled: boolean; 
}

export interface ChatRoom {
  key: string;
  name: string;
  enabled: boolean;
}


export interface CustomChatRoom {
  room_key: string;
  name: string;
  description: string;
  cover: string; 
  max_users: number; 
  enabled: number;
  created_at: string;
  updated_at: string;
  member_count?: number; 
}


export interface RoomUserOption {
  id: number;
  username: string;
}



export interface CommentNotifySettings {
  enabled: boolean;
  notifyEmail: string;
  dailyLimit: number;
  reserveForRegister: number;
  notifyAdminOnNew: boolean;
  notifyAdminReply: boolean;
  notifyUserReply: boolean;
}
