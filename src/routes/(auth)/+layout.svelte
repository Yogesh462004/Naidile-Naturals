<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="relative flex min-h-screen w-full items-center justify-center px-4 py-10 bg-cover bg-center bg-no-repeat"
	style="background-image: url('/images/hero-floral.jpg');"
>
	<!-- Semi-transparent overlay to keep the background floral image light and subtle -->
	<div class="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-0"></div>

	<div class="relative z-10 flex w-full max-w-[420px] flex-col items-center">
		<div class="w-full rounded-[24px] border border-line bg-white/95 p-6 shadow-2xl backdrop-blur-md">
			<a href="/" class="mb-6 flex flex-col items-center gap-2">
				<img src="/images/logo.png" alt="Naidile Naturals" class="h-16 w-16 rounded-full shadow-md" />
				<span class="serif text-xl text-ink font-semibold tracking-wide">Naidile Naturals</span>
			</a>
			{@render children()}
		</div>
	</div>
</div>
