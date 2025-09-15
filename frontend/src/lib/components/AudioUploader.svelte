<script lang="ts">
  export let file: File | null = null;
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      file = input.files[0];
    }
  }
  
  function removeFile() {
    file = null;
  }
  
  const acceptedFormats = '.mp3,.wav,.flac,.m4a,.aac,.ogg';
</script>

<div class="audio-uploader">
  {#if !file}
    <label class="upload-area">
      <input
        type="file"
        accept={acceptedFormats}
        on:change={handleFileSelect}
        class="hidden"
      />
      <div class="upload-content">
        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm">클릭하여 오디오 파일 선택</p>
        <p class="text-xs text-gray-500 mt-1">MP3, WAV, FLAC 지원</p>
      </div>
    </label>
  {:else}
    <div class="file-info">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">{file.name}</p>
          <p class="text-sm text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          on:click={removeFile}
          class="text-red-400 hover:text-red-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-area {
    display: block;
    border: 2px dashed #4b5563;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .upload-area:hover {
    border-color: #6b7280;
    background-color: rgba(75, 85, 99, 0.1);
  }
  
  .file-info {
    padding: 1rem;
    background-color: #374151;
    border-radius: 0.5rem;
  }
</style>
