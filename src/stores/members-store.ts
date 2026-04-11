import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Member } from 'src/databases/entities/member';
import { MemberRepository } from 'src/databases/repositories/member.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useMembersStore = defineStore('members', {
  state: () => ({
    members: [] as Member[],
    memberRepository: null as MemberRepository | null,
    activityLogService: null as ActivityLogService | null,
    totalMembers: 0,
  }),

  getters: {
    memberCount: (state) => state.members.length,
    memberList: (state) => state.members,
    member: (state) => (id: number) => state.members.find((m) => m.id === id),
  },

  actions: {
    clear() {
      this.members = [];
      this.totalMembers = 0;
      this.memberRepository = null;
      this.activityLogService = null;
    },
    async ensureRepository() {
      if (!this.memberRepository) {
        await this.init(false);
      }
      if (!this.memberRepository) {
        throw new Error('Repository not initialized');
      }
      return this.memberRepository;
    },
    async init(loadAll = true) {
      this.memberRepository = new MemberRepository();
      if (loadAll) {
        this.members = await this.memberRepository.findAll();
      }
      this.activityLogService = new ActivityLogService();
    },
    async searchMembers(searchTerm: string, limit = 25): Promise<Member[]> {
      try {
        const repository = await this.ensureRepository();
        return await repository.findByNameLike(searchTerm, limit);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },
    async searchMembersPage(
      keyword: string,
      page: number,
      limit: number,
    ): Promise<{ rows: Member[]; total: number }> {
      try {
        const repository = await this.ensureRepository();
        const [rows, total] = await Promise.all([
          repository.searchAllByKeyword(keyword, page, limit),
          repository.countSearchResults(keyword),
        ]);
        this.members = rows;
        this.totalMembers = total;
        return { rows, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { rows: [], total: 0 };
      }
    },
    async findDisabledByExactName(name: string): Promise<Member | null> {
      try {
        const repository = await this.ensureRepository();
        return await repository.findDisabledByExactName(name);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return null;
      }
    },
    enableMember(member: Member): Member | null {
      if (member.id == null) {
        return null;
      }
      if (!this.memberRepository) {
        return null;
      }
      try {
        const updated: Member = { ...member, is_active: 1 };
        void this.memberRepository.update({
          id: member.id,
          name: updated.name,
          is_active: 1,
        });
        const index = this.members.findIndex((m) => m.id === updated.id);
        if (index !== -1) {
          this.members[index] = { ...this.members[index], ...updated } as Member;
        } else {
          this.members.unshift(updated);
        }
        return updated;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return null;
      }
    },
    async addMember(member: Partial<Member>): Promise<void> {
      await this.createMember(member);
    },
    async createMember(member: Partial<Member>): Promise<Member | null> {
      try {
        const repository = await this.ensureRepository();
        const payload: Member = {
          name: member.name ?? '',
          is_active: member.is_active ?? 1,
        };
        const id = await repository.insert(payload);
        const createdMember = { ...payload, id } as Member;
        this.members.unshift(createdMember);
        return createdMember;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return null;
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
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    deleteMember(id: number) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      try {
        void this.memberRepository.delete(id);
        this.members = this.members.filter((m) => m.id !== id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    async fetchPage(page: number, limit: number = 20): Promise<{ rows: Member[]; total: number }> {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      const [rows, total] = await Promise.all([
        this.memberRepository.findAllWithPagination(page, limit),
        this.memberRepository.countAll(),
      ]);
      this.members = rows;
      this.totalMembers = total;
      return { rows, total };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMembersStore, import.meta.hot));
}
