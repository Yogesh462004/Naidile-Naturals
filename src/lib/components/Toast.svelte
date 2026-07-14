<script lang="ts">
	import { toastState } from '$lib/stores/toast.svelte';
</script>

{#if toastState.visible}
	<div
		role="status"
		aria-live="polite"
		class="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-olive-deep px-5 py-2.5 text-sm text-white shadow-card transition-opacity"
	>
		{toastState.message}
	</div>
{/if}
