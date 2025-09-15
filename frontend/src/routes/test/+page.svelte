<script>
  let message = "Genesis Music Player Test Page";
  let count = 0;
  
  function handleClick() {
    count++;
  }
</script>

<svelte:head>
  <title>Test Page - Genesis Music</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <h1 class="text-4xl font-bold mb-8">{message}</h1>
  
  <div class="space-y-8">
    <section class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">🎸 Component Test</h2>
      <p class="mb-4">This is a simple test page to verify the routing works.</p>
      
      <button 
        on:click={handleClick}
        class="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
      >
        Click Count: {count}
      </button>
    </section>
    
    <section class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">📍 Available Routes</h2>
      <ul class="space-y-2">
        <li><a href="/" class="text-blue-400 hover:underline">Home Page</a></li>
        <li><a href="/player" class="text-blue-400 hover:underline">Player Page (with components)</a></li>
        <li><a href="/test" class="text-blue-400 hover:underline">Test Page (current)</a></li>
      </ul>
    </section>
    
    <section class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">✅ Project Status</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-700 p-4 rounded">
          <h3 class="font-semibold mb-2">Frontend Components</h3>
          <ul class="text-sm space-y-1 text-gray-300">
            <li>✅ AudioPlayer</li>
            <li>✅ FretboardView</li>
            <li>✅ TheoryPanel</li>
            <li>✅ TabViewer</li>
            <li>✅ YouTubeInput</li>
          </ul>
        </div>
        <div class="bg-gray-700 p-4 rounded">
          <h3 class="font-semibold mb-2">Technologies</h3>
          <ul class="text-sm space-y-1 text-gray-300">
            <li>✅ SvelteKit</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ WaveSurfer.js</li>
            <li>✅ Tone.js</li>
            <li>✅ Three.js</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
  /* Additional styles if needed */
</style>