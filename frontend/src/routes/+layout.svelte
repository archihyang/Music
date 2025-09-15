<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navigation from '$components/Navigation.svelte';
	import Footer from '$components/Footer.svelte';
	import ErrorDisplay from '$components/ErrorDisplay.svelte';
	
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Genesis Music - AI 기반 기타 학습 플랫폼</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- Navigation -->
	<Navigation />
	
	<!-- Main Content -->
	<main class="flex-1 container mx-auto px-4 py-8">
		<slot />
	</main>
	
	<!-- Footer -->
	<Footer />
	
	<!-- Error Display -->
	<ErrorDisplay />
</div>

<!-- Global Loading Indicator -->
{#if !mounted}
	<div class="fixed inset-0 bg-base-100 flex items-center justify-center z-50">
		<div class="loading loading-spinner loading-lg text-primary"></div>
	</div>
{/if}