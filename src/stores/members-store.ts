import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Member } from 'src/databases/entities/member';
import type { MemberRepository } from 'src/databases/repositories/member.repository';

export const useMembersStore = defineStore('members', {
  state: () => ({
    members: [] as Member[],
    memberRepository: null as MemberRepository | null,
  }),

  getters: {
    memberCount: (state) => state.members.length,
    memberList: (state) => state.members,
    member: (state) => (id: number) => state.members.find((m) => m.id === id),
  },

  actions: {
    async init(repo: MemberRepository) {
      this.memberRepository = repo;
      this.members = await this.memberRepository.findAll();
    },
    async addMember(member: Member) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      const id = await this.memberRepository.insert(member);
      member.id = id;
      this.members.push(member);
    },
    async updateMember(member: Member) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      await this.memberRepository.update(member);
      const index = this.members.findIndex((m) => m.id === member.id);
      if (index !== -1) {
        this.members[index] = member;
      }
    },
    async deleteMember(id: number) {
      if (!this.memberRepository) throw new Error('Repository not initialized');
      await this.memberRepository.delete(id);
      this.members = this.members.filter((m) => m.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMembersStore, import.meta.hot));
}
