<script lang="ts">
  import { Music, Github, Mail, Heart } from 'lucide-svelte';
  
  const currentYear = new Date().getFullYear();
</script>

<footer class="footer footer-center p-10 bg-base-200 text-base-content">
  <div class="grid grid-flow-col gap-4">
    <a href="/about" class="link link-hover">소개</a>
    <a href="/contact" class="link link-hover">문의</a>
    <a href="/privacy" class="link link-hover">개인정보처리방침</a>
    <a href="/terms" class="link link-hover">이용약관</a>
  </div>
  
  <div>
    <div class="grid grid-flow-col gap-4">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
        <Github size={24} class="hover:text-primary transition-colors" />
      </a>
      <a href="mailto:contact@genesismusic.com" aria-label="Email">
        <Mail size={24} class="hover:text-primary transition-colors" />
      </a>
    </div>
  </div>
  
  <div>
    <p class="flex items-center gap-2">
      Copyright © {currentYear} Genesis Music - Made with 
      <Heart size={16} class="text-red-500" fill="currentColor" />
      for musicians
    </p>
  </div>
</footer>

<style>
  .footer {
    margin-top: auto;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>