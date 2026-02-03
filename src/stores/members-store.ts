import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Member } from 'src/databases/entities/member';
import { MemberRepository } from 'src/databases/repositories/member.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useMembersStore = defineStore('members', {
  state: () => ({
    members: [] as Member[],
    memberRepository: null as MemberRepository | null,
    activityLogService: null as ActivityLogService | null,
  }),

  getters: {
    memberCount: (state) => state.members.length,
    memberList: (state) => state.members,
    member: (state) => (id: number) => state.members.find((m) => m.id === id),
  },

  actions: {
    async init() {
      this.memberRepository = new MemberRepository();
      this.members = await this.memberRepository.findAll();
      this.activityLogService = new ActivityLogService();
    },
    async addMember(name: string): Promise<void> {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      try {
        const id = await this.memberRepository.insert({
          name,
          is_active: true,
        });
        const member = { name, is_active: true, id } as Member;
        this.members.unshift(member);
      } catch (error: unknown) {
        this.activityLogService?.logErrActivity(error);
      }
    },
    updateMember(member: Partial<Member>) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      try {
        void this.memberRepository.update(member);
        const index = this.members.findIndex((m) => m.id === member.id);
        if (index !== -1) {
          this.members[index] = { ...this.members[index], ...member } as Member;
        }
      } catch (error: unknown) {
        this.activityLogService?.logErrActivity(error);
      }
    },
    deleteMember(id: number) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      try {
        void this.memberRepository.delete(id);
        this.members = this.members.filter((m) => m.id !== id);
      } catch (error: unknown) {
        this.activityLogService?.logErrActivity(error);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMembersStore, import.meta.hot));
}
