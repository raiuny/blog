import { create } from 'zustand'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string
  published: boolean
  authorName: string
  authorAvatar: string | null
  githubUrl: string | null
  readTime: number
  createdAt: string
  updatedAt: string
  sha?: string
}

export interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

interface BlogState {
  // View state
  view: 'home' | 'post'
  selectedPost: BlogPost | null
  posts: BlogPost[]
  totalPosts: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isEditorOpen: boolean
  editingPost: BlogPost | null
  searchQuery: string
  activeTag: string | null
  allTags: string[]

  // GitHub
  githubConfig: GitHubConfig | null
  githubSynced: boolean

  // Actions
  setView: (view: 'home' | 'post') => void
  selectPost: (post: BlogPost | null) => void
  setPosts: (posts: BlogPost[], total: number, totalPages: number) => void
  setPage: (page: number) => void
  setLoading: (loading: boolean) => void
  openEditor: (post?: BlogPost) => void
  closeEditor: () => void
  setSearch: (query: string) => void
  setTag: (tag: string | null) => void
  setAllTags: (tags: string[]) => void
  removePostFromList: (id: string) => void
  updatePostInList: (post: BlogPost) => void
  addPostToList: (post: BlogPost) => void

  // GitHub actions
  setGithubConfig: (config: GitHubConfig | null) => void
  setGithubSynced: (synced: boolean) => void
  loadGithubConfig: () => void
}

export const useBlogStore = create<BlogState>((set, get) => ({
  view: 'home',
  selectedPost: null,
  posts: [],
  totalPosts: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isEditorOpen: false,
  editingPost: null,
  searchQuery: '',
  activeTag: null,
  allTags: [],
  githubConfig: null,
  githubSynced: false,

  setView: (view) => set({ view }),
  selectPost: (post) => set({ selectedPost: post, view: post ? 'post' : 'home' }),
  setPosts: (posts, total, totalPages) => set({ posts, totalPosts: total, totalPages }),
  setPage: (page) => set({ currentPage: page }),
  setLoading: (isLoading) => set({ isLoading }),
  openEditor: (post) => set({ isEditorOpen: true, editingPost: post || null }),
  closeEditor: () => set({ isEditorOpen: false, editingPost: null }),
  setSearch: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setTag: (tag) => set({ activeTag: tag, currentPage: 1 }),
  setAllTags: (allTags) => set({ allTags }),
  removePostFromList: (id) => set((s) => ({
    posts: s.posts.filter((p) => p.id !== id && p.slug !== id),
    totalPosts: s.totalPosts - 1,
  })),
  updatePostInList: (post) => set((s) => ({
    posts: s.posts.map((p) => (p.slug === post.slug || p.id === post.id ? post : p)),
  })),
  addPostToList: (post) => set((s) => ({
    posts: [post, ...s.posts],
    totalPosts: s.totalPosts + 1,
  })),

  setGithubConfig: (githubConfig) => {
    set({ githubConfig, githubSynced: !!githubConfig })
    if (typeof window !== 'undefined') {
      if (githubConfig) {
        localStorage.setItem('blog-github-config', JSON.stringify(githubConfig))
      } else {
        localStorage.removeItem('blog-github-config')
      }
    }
  },
  setGithubSynced: (githubSynced) => set({ githubSynced }),
  loadGithubConfig: () => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('blog-github-config')
    if (raw) {
      try {
        const config = JSON.parse(raw) as GitHubConfig
        set({ githubConfig: config, githubSynced: true })
      } catch {
        localStorage.removeItem('blog-github-config')
      }
    }
  },
}))
