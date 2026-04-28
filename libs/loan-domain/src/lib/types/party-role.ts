import { PartyRoleType, PartyType } from '../enums/party-role-type';

export interface PartyRole {
  readonly id: string;
  readonly version: number;
  readonly lendingArrangementId: string;
  readonly arrangementId: string;
  readonly partyId: string;
  readonly partyType: PartyType;
  readonly role: PartyRoleType;
  readonly rolePercentage?: number;
  readonly roleStartedAt: string;
  readonly roleEndedAt?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
