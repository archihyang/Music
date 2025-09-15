<script lang="ts">
  import { page } from '$app/stores';
  import { Menu, X, Music, Home, Upload, BookOpen, Settings, User } from 'lucide-svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  
  function closeMenu() {
    isMenuOpen = false;
  }
</script>

<nav class="navbar bg-base-100 shadow-lg">
  <div class="navbar-start">
    <div class="dropdown">
      <button 
        class="btn btn-ghost lg:hidden"
        on:click={toggleMenu}
        aria-label="Toggle menu"
      >
        {#if isMenuOpen}
          <X size={24} />
        {:else}
          <Menu size={24} />
        {/if}
      </button>
      
      {#if isMenuOpen}
        <ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li><a href="/" on:click={closeMenu}><Home size={18} /> 홈</a></li>
          <li><a href="/upload" on:click={closeMenu}><Upload size={18} /> 업로드</a></li>
          <li><a href="/library" on:click={closeMenu}><BookOpen size={18} /> 라이브러리</a></li>
          <li><a href="/learn" on:click={closeMenu}><Music size={18} /> 학습</a></li>
        </ul>
      {/if}
    </div>
    
    <a href="/" class="btn btn-ghost normal-case text-xl">
      <Music size={28} class="text-primary" />
      <span class="ml-2 font-bold">Genesis Music</span>
    </a>
  </div>
  
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li>
        <a href="/" class:active={$page.url.pathname === '/'}>
          <Home size={18} /> 홈
        </a>
      </li>
      <li>
        <a href="/upload" class:active={$page.url.pathname === '/upload'}>
          <Upload size={18} /> 업로드
        </a>
      </li>
      <li>
        <a href="/library" class:active={$page.url.pathname === '/library'}>
          <BookOpen size={18} /> 라이브러리
        </a>
      </li>
      <li>
        <a href="/learn" class:active={$page.url.pathname === '/learn'}>
          <Music size={18} /> 학습
        </a>
      </li>
    </ul>
  </div>
  
  <div class="navbar-end">
    <ThemeToggle size="sm" />
    <button class="btn btn-ghost btn-circle">
      <Settings size={20} />
    </button>
    <button class="btn btn-ghost btn-circle">
      <div class="avatar placeholder">
        <div class="bg-neutral-focus text-neutral-content rounded-full w-10">
          <User size={20} />
        </div>
      </div>
    </button>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .menu a.active {
    background: var(--fallback-p, oklch(var(--p)/0.1));
    color: var(--fallback-p, oklch(var(--p)));
    font-weight: 600;
  }
  
  @media (max-width: 1024px) {
    .dropdown-content {
      position: absolute;
      left: 0;
      top: 100%;
    }
  }
</style>