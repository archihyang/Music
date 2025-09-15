<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Upload, X, Music, FileAudio, AlertCircle } from 'lucide-svelte';
  import { 
    uploadProgress, 
    uploadStatus, 
    currentFile,
    transcriptionJob,
    transcriptionProgress
  } from '$lib/stores/audioStore';
  import { 
    isValidAudioFile, 
    formatFileSize, 
    MAX_FILE_SIZE,
    type UploadStatus,
    type TranscriptionJob 
  } from '$lib/types';
  
  const dispatch = createEventDispatcher();
  
  let fileInput: HTMLInputElement;
  let dropZone: HTMLDivElement;
  let isDragOver = false;
  let uploadError = '';
  let youtubeUrl = '';
  let isProcessingYoutube = false;

  // 파일 업로드 처리
  async function handleFileSelect(file: File) {
    // 초기화
    uploadError = '';
    $uploadStatus = null;
    
    // 파일 검증
    if (!isValidAudioFile(file)) {
      uploadError = '지원하지 않는 파일 형식입니다. MP3, WAV, M4A 파일을 업로드해주세요.';
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      uploadError = `파일 크기가 너무 큽니다. 최대 ${formatFileSize(MAX_FILE_SIZE)}까지 지원합니다.`;
      return;
    }
    
    // 스토어 업데이트
    $currentFile = file;
    $uploadProgress = 0;
    $uploadStatus = {
      status: 'uploading',
      message: '파일을 업로드하고 있습니다...'
    };
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('onset_threshold', '0.5');
    formData.append('frame_threshold', '0.3');
    formData.append('minimum_note_length', '100');
    formData.append('midi_tempo', '120');
    
    try {
      // XMLHttpRequest로 진행률 추적
      const xhr = new XMLHttpRequest();
      
      // 진행률 이벤트
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          $uploadProgress = progress;
        }
      });
      
      // 완료 이벤트
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 202) {
          const response = JSON.parse(xhr.responseText);
          handleUploadSuccess(response);
        } else {
          handleUploadError('업로드 실패: ' + xhr.statusText);
        }
      });
      
      // 에러 이벤트
      xhr.addEventListener('error', () => {
        handleUploadError('네트워크 오류가 발생했습니다.');
      });
      
      // 요청 전송
      xhr.open('POST', '/api/v1/transcribe/upload');
      xhr.send(formData);
      
    } catch (error) {
      handleUploadError('업로드 중 오류가 발생했습니다: ' + error);
    }
  }
  
  // YouTube URL 처리
  async function handleYoutubeSubmit() {
    if (!youtubeUrl.trim()) {
      uploadError = 'YouTube URL을 입력해주세요.';
      return;
    }
    
    // YouTube URL 검증
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      uploadError = '올바른 YouTube URL을 입력해주세요.';
      return;
    }
    
    uploadError = '';
    isProcessingYoutube = true;
    $uploadStatus = {
      status: 'uploading',
      message: 'YouTube 영상을 처리하고 있습니다...'
    };
    
    try {
      const response = await fetch('/api/v1/transcribe/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: youtubeUrl,
          onset_threshold: 0.5,
          frame_threshold: 0.3,
          minimum_note_length: 100,
          midi_tempo: 120
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        handleUploadSuccess(data);
        youtubeUrl = '';
      } else {
        const error = await response.json();
        handleUploadError(error.detail || 'YouTube 처리 실패');
      }
    } catch (error) {
      handleUploadError('YouTube 처리 중 오류가 발생했습니다: ' + error);
    } finally {
      isProcessingYoutube = false;
    }
  }
  
  // 업로드 성공 처리
  function handleUploadSuccess(response: any) {
    $uploadProgress = 100;
    $uploadStatus = {
      status: 'completed',
      message: '업로드 완료! 전사 작업이 시작되었습니다.'
    };
    
    // 전사 작업 정보 저장
    $transcriptionJob = {
      id: response.job_id || response.jobId,
      status: 'processing',
      progress: 0,
      createdAt: new Date()
    };
    
    // 전사 진행 상태 확인 시작
    startPollingJobStatus(response.job_id || response.jobId);
    
    // 이벤트 발생
    dispatch('uploadComplete', response);
  }
  
  // 업로드 에러 처리
  function handleUploadError(error: string) {
    uploadError = error;
    $uploadStatus = {
      status: 'error',
      error: error
    };
    $uploadProgress = 0;
    $currentFile = null;
  }
  
  // 전사 작업 상태 폴링
  async function startPollingJobStatus(jobId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/transcribe/status/${jobId}`);
        if (response.ok) {
          const status = await response.json();
          
          // 진행률 업데이트
          $transcriptionProgress = status.progress || 0;
          
          // 상태 업데이트
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            $transcriptionJob = {
              ...$transcriptionJob!,
              status: 'completed',
              completedAt: new Date(),
              result: status.result
            };
            dispatch('transcriptionComplete', status.result);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            $transcriptionJob = {
              ...$transcriptionJob!,
              status: 'failed',
              error: status.error || '전사 작업 실패'
            };
            uploadError = '전사 작업이 실패했습니다: ' + (status.error || '알 수 없는 오류');
          }
        }
      } catch (error) {
        console.error('Job status polling error:', error);
      }
    }, 2000); // 2초마다 확인
    
    // 5분 후 자동 중지
    setTimeout(() => clearInterval(pollInterval), 300000);
  }
  
  // 드래그 앤 드롭 이벤트
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }
  
  // 파일 제거
  function removeFile() {
    $currentFile = null;
    $uploadProgress = 0;
    $uploadStatus = null;
    uploadError = '';
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  onMount(() => {
    // 컴포넌트 마운트 시 초기화
    return () => {
      // 클린업
    };
  });
</script>

<div class="file-upload-container">
  <!-- 업로드 영역 -->
  <div 
    bind:this={dropZone}
    class="upload-zone"
    class:drag-over={isDragOver}
    class:has-file={$currentFile}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
  >
    {#if $currentFile}
      <!-- 파일 정보 표시 -->
      <div class="file-info">
        <div class="file-icon">
          <FileAudio size={48} />
        </div>
        <div class="file-details">
          <h3>{$currentFile.name}</h3>
          <p>{formatFileSize($currentFile.size)}</p>
          
          {#if $uploadStatus?.status === 'uploading'}
            <div class="progress-container">
              <progress class="progress progress-primary" value={$uploadProgress} max="100"></progress>
              <span>{$uploadProgress.toFixed(0)}%</span>
            </div>
          {/if}
          
          {#if $uploadStatus?.status === 'completed'}
            <div class="alert alert-success">
              <span>{$uploadStatus.message}</span>
            </div>
          {/if}
          
          {#if $transcriptionJob}
            <div class="transcription-status">
              <p>전사 상태: {$transcriptionJob.status}</p>
              {#if $transcriptionJob.status === 'processing'}
                <progress class="progress progress-secondary" value={$transcriptionProgress} max="100"></progress>
              {/if}
            </div>
          {/if}
        </div>
        <button class="btn btn-ghost btn-sm" on:click={removeFile}>
          <X size={20} />
        </button>
      </div>
    {:else}
      <!-- 업로드 프롬프트 -->
      <div class="upload-prompt">
        <Upload size={64} class="upload-icon" />
        <h2>음악 파일을 업로드하세요</h2>
        <p>MP3, WAV, M4A 파일을 드래그하거나 클릭하여 선택</p>
        
        <div class="upload-buttons">
          <button 
            class="btn btn-primary"
            on:click={() => fileInput.click()}
          >
            파일 선택
          </button>
        </div>
        
        <input 
          bind:this={fileInput}
          type="file"
          accept="audio/*"
          on:change={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          style="display: none;"
        >
      </div>
    {/if}
  </div>
  
  <!-- YouTube URL 입력 -->
  <div class="youtube-section">
    <div class="divider">또는</div>
    
    <div class="youtube-input">
      <h3>YouTube URL로 시작하기</h3>
      <div class="input-group">
        <input 
          type="url"
          bind:value={youtubeUrl}
          placeholder="https://www.youtube.com/watch?v=..."
          class="input input-bordered w-full"
          disabled={isProcessingYoutube}
        >
        <button 
          class="btn btn-primary"
          on:click={handleYoutubeSubmit}
          disabled={isProcessingYoutube || !youtubeUrl.trim()}
        >
          {#if isProcessingYoutube}
            <span class="loading loading-spinner"></span>
          {:else}
            처리 시작
          {/if}
        </button>
      </div>
    </div>
  </div>
  
  <!-- 에러 메시지 -->
  {#if uploadError}
    <div class="alert alert-error mt-4">
      <AlertCircle size={20} />
      <span>{uploadError}</span>
    </div>
  {/if}
</div>

<style>
  .file-upload-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .upload-zone {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    transition: all 0.3s ease;
    background: white;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .upload-zone:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }
  
  .upload-zone.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: scale(1.02);
  }
  
  .upload-zone.has-file {
    cursor: default;
  }
  
  .upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .upload-prompt h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
  
  .upload-prompt p {
    color: #64748b;
    margin: 0;
  }
  
  :global(.upload-icon) {
    color: #cbd5e1;
  }
  
  .upload-buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
  }
  
  .file-icon {
    flex-shrink: 0;
    color: #3b82f6;
  }
  
  .file-details {
    flex: 1;
    text-align: left;
  }
  
  .file-details h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1e293b;
  }
  
  .file-details p {
    color: #64748b;
    margin: 0 0 16px 0;
  }
  
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
  }
  
  .progress-container progress {
    flex: 1;
  }
  
  .transcription-status {
    margin-top: 16px;
    padding: 12px;
    background: #f1f5f9;
    border-radius: 8px;
  }
  
  .transcription-status p {
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  
  .youtube-section {
    margin-top: 40px;
  }
  
  .youtube-input h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #1e293b;
  }
  
  .input-group {
    display: flex;
    gap: 12px;
  }
  
  .input-group input {
    flex: 1;
  }
  
  @media (max-width: 640px) {
    .upload-zone {
      padding: 24px;
    }
    
    .upload-prompt h2 {
      font-size: 1.25rem;
    }
    
    .input-group {
      flex-direction: column;
    }
  }
</style>