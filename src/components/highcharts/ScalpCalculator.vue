<!-- src/components/highcharts/ScalpCalculator.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Calculator, TrendingUp, TrendingDown } from "lucide-vue-next";
import { wsManager } from "../../composables/useWebSocketManager";

const props = defineProps<{
	symbol: string;
}>();

const accountBalance = ref(1000); // $1000 capital default
const riskPercent = ref(1); // 1% risk default
const positionSide = ref<"long" | "short">("long");
const entryPrice = ref<number | null>(null);
const stopLossPrice = ref<number | null>(null);
const currentLivePrice = ref<number>(0);

let currentSubscription: string | null = null;

const onTickerMessage = (data: any) => {
	if (data && data.c) {
		const p = parseFloat(data.c);
		currentLivePrice.value = p;
		if (!entryPrice.value) {
			entryPrice.value = p;
		}
	}
};

// Subscribe to ticker stream to get real-time price
const subscribeTicker = (sym: string) => {
	if (currentSubscription) {
		wsManager.unsubscribe(currentSubscription, onTickerMessage);
	}
	const stream = `${sym.toLowerCase()}@ticker`;
	currentSubscription = stream;

	wsManager.subscribe(stream, onTickerMessage);
};

watch(
	() => props.symbol,
	(newSym) => {
		entryPrice.value = null;
		stopLossPrice.value = null;
		if (newSym) {
			subscribeTicker(newSym);
		}
	},
	{ immediate: true },
);

const setQuickRisk = (pct: number) => {
	riskPercent.value = pct;
};

const fillCurrentPrice = () => {
	if (currentLivePrice.value > 0) {
		entryPrice.value = currentLivePrice.value;
		// Auto populate reasonable scalp stop loss (0.5% away)
		if (positionSide.value === "long") {
			stopLossPrice.value = parseFloat(
				(currentLivePrice.value * 0.995).toFixed(2),
			);
		} else {
			stopLossPrice.value = parseFloat(
				(currentLivePrice.value * 1.005).toFixed(2),
			);
		}
	}
};

// Calculations
const riskAmountUsd = computed(() => {
	return accountBalance.value * (riskPercent.value / 100);
});

const stopLossDistancePct = computed(() => {
	if (!entryPrice.value || !stopLossPrice.value || entryPrice.value <= 0)
		return 0;
	const diff = Math.abs(entryPrice.value - stopLossPrice.value);
	return (diff / entryPrice.value) * 100;
});

const recommendedPositionSizeUsd = computed(() => {
	if (stopLossDistancePct.value <= 0) return 0;
	return riskAmountUsd.value / (stopLossDistancePct.value / 100);
});

const recommendedQuantity = computed(() => {
	if (!entryPrice.value || entryPrice.value <= 0) return 0;
	return recommendedPositionSizeUsd.value / entryPrice.value;
});

const requiredLeverage = computed(() => {
	if (accountBalance.value <= 0) return 1;
	const lev = recommendedPositionSizeUsd.value / accountBalance.value;
	return Math.max(1, Math.round(lev * 10) / 10);
});

// Take Profit Targets (1:1.5 and 1:2 R:R)
const targetTp1 = computed(() => {
	if (!entryPrice.value || !stopLossPrice.value) return 0;
	const riskDist = Math.abs(entryPrice.value - stopLossPrice.value);
	return positionSide.value === "long"
		? entryPrice.value + riskDist * 1.5
		: entryPrice.value - riskDist * 1.5;
});

const targetTp2 = computed(() => {
	if (!entryPrice.value || !stopLossPrice.value) return 0;
	const riskDist = Math.abs(entryPrice.value - stopLossPrice.value);
	return positionSide.value === "long"
		? entryPrice.value + riskDist * 2
		: entryPrice.value - riskDist * 2;
});
</script>

<template>
	<div
		class="h-full w-full bg-[#000000] border border-[#222222] flex flex-col font-mono text-white select-none overflow-hidden"
	>
		<!-- Header -->
		<div
			class="h-8 border-b border-[#222222] bg-[#050505] px-2.5 flex items-center justify-between text-[10px]"
		>
			<div
				class="flex items-center gap-1.5 font-bold uppercase tracking-wider text-green-500"
			>
				<Calculator class="h-3.5 w-3.5 text-green-500" />
				<span>Scalp Risk & Size Calculator</span>
			</div>
			<div class="text-[9px] text-gray-500">
				Live:
				<span class="text-white font-bold"
					>${{ currentLivePrice.toLocaleString() }}</span
				>
			</div>
		</div>

		<!-- Body -->
		<div
			class="p-2.5 flex-1 min-h-0 overflow-y-auto space-y-2.5 text-[10px]"
		>
			<!-- Side Selector & Quick Fill -->
			<div class="grid grid-cols-2 gap-1.5">
				<button
					@click="positionSide = 'long'"
					class="py-1 px-2 border rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1 text-[9px] transition-all"
					:class="
						positionSide === 'long'
							? 'bg-green-500/20 text-green-400 border-green-500'
							: 'bg-[#111111] text-gray-400 border-[#222222] hover:text-white'
					"
				>
					<TrendingUp class="h-3 w-3" />
					<span>Long Scalp</span>
				</button>
				<button
					@click="positionSide = 'short'"
					class="py-1 px-2 border rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1 text-[9px] transition-all"
					:class="
						positionSide === 'short'
							? 'bg-red-500/20 text-red-400 border-red-500'
							: 'bg-[#111111] text-gray-400 border-[#222222] hover:text-white'
					"
				>
					<TrendingDown class="h-3 w-3" />
					<span>Short Scalp</span>
				</button>
			</div>

			<!-- Balance & Risk Row -->
			<div class="grid grid-cols-2 gap-2">
				<div>
					<label
						class="text-[8px] uppercase tracking-wider text-gray-500 font-bold block mb-1"
					>
						Account Margin ($)
					</label>
					<input
						v-model.number="accountBalance"
						type="number"
						class="w-full bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-white font-mono focus:border-green-500 focus:outline-none"
					/>
				</div>
				<div>
					<label
						class="text-[8px] uppercase tracking-wider text-gray-500 font-bold block mb-1"
					>
						Risk Per Trade (%)
					</label>
					<div class="flex items-center gap-1">
						<input
							v-model.number="riskPercent"
							type="number"
							step="0.5"
							class="w-1/2 bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-white font-mono focus:border-green-500 focus:outline-none"
						/>
						<div class="flex gap-0.5 w-1/2">
							<button
								v-for="p in [0.5, 1, 2]"
								:key="p"
								@click="setQuickRisk(p)"
								class="flex-1 py-1 text-[8px] font-bold rounded border"
								:class="
									riskPercent === p
										? 'border-green-500 bg-green-500/10 text-green-400'
										: 'border-[#262626] text-gray-400 hover:text-white'
								"
							>
								{{ p }}%
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Entry Price & Stop Loss with Current Price Fill -->
			<div
				class="space-y-1.5 bg-[#080808] border border-[#1a1a1a] p-2 rounded"
			>
				<div class="flex items-center justify-between">
					<span
						class="text-[8px] text-gray-500 uppercase font-bold tracking-wider"
						>Prices Setup</span
					>
					<button
						@click="fillCurrentPrice"
						class="text-[8px] text-amber-400 hover:underline uppercase font-bold tracking-wide"
					>
						⚡ Auto-Fill Current Price
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="text-[8px] text-gray-400 block mb-0.5"
							>Entry Price</label
						>
						<input
							v-model.number="entryPrice"
							type="number"
							placeholder="e.g. 95000"
							class="w-full bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-white font-mono focus:border-green-500 focus:outline-none text-[9px]"
						/>
					</div>
					<div>
						<label class="text-[8px] text-red-400 block mb-0.5"
							>Stop Loss</label
						>
						<input
							v-model.number="stopLossPrice"
							type="number"
							placeholder="e.g. 94500"
							class="w-full bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-white font-mono focus:border-red-500 focus:outline-none text-[9px]"
						/>
					</div>
				</div>
			</div>

			<!-- Sizing Summary Cards -->
			<div class="space-y-1.5 pt-1 border-t border-[#1a1a1a]">
				<div class="flex justify-between items-center text-[9px]">
					<span class="text-gray-500">Max Dollar Risk:</span>
					<span class="text-red-400 font-bold"
						>-${{ riskAmountUsd.toFixed(2) }}</span
					>
				</div>
				<div class="flex justify-between items-center text-[9px]">
					<span class="text-gray-500">Stop Distance:</span>
					<span class="text-gray-300 font-bold"
						>{{ stopLossDistancePct.toFixed(2) }}%</span
					>
				</div>
				<div class="flex justify-between items-center text-[9px]">
					<span class="text-gray-500">Recommended Position:</span>
					<span class="text-green-400 font-bold">
						${{
							recommendedPositionSizeUsd.toLocaleString(
								undefined,
								{
									maximumFractionDigits: 1,
								},
							)
						}}
					</span>
				</div>
				<div class="flex justify-between items-center text-[9px]">
					<span class="text-gray-500">Contract Quantity:</span>
					<span class="text-white font-bold">
						{{ recommendedQuantity.toFixed(4) }}
						{{ props.symbol.replace("USDT", "") }}
					</span>
				</div>
				<div class="flex justify-between items-center text-[9px]">
					<span class="text-gray-500">Min Suggested Leverage:</span>
					<span
						class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30"
					>
						{{ requiredLeverage }}x
					</span>
				</div>
			</div>

			<!-- Take Profit Target Targets -->
			<div class="pt-2 border-t border-[#1a1a1a] space-y-1">
				<span
					class="text-[8px] uppercase font-bold text-gray-500 tracking-wider block"
					>Scalper Profit Targets</span
				>
				<div class="grid grid-cols-2 gap-2 text-[8px]">
					<div
						class="bg-[#0a0a0a] border border-[#222222] p-1.5 rounded flex flex-col"
					>
						<span class="text-gray-500 font-semibold"
							>TP 1 (1:1.5 R:R)</span
						>
						<span class="text-green-400 font-bold mt-0.5">
							${{
								targetTp1 > 0
									? targetTp1.toLocaleString(undefined, {
											maximumFractionDigits: 2,
										})
									: "-"
							}}
						</span>
						<span class="text-gray-500 text-[7px]"
							>+${{ (riskAmountUsd * 1.5).toFixed(2) }}</span
						>
					</div>
					<div
						class="bg-[#0a0a0a] border border-[#222222] p-1.5 rounded flex flex-col"
					>
						<span class="text-gray-500 font-semibold"
							>TP 2 (1:2.0 R:R)</span
						>
						<span class="text-green-400 font-bold mt-0.5">
							${{
								targetTp2 > 0
									? targetTp2.toLocaleString(undefined, {
											maximumFractionDigits: 2,
										})
									: "-"
							}}
						</span>
						<span class="text-gray-500 text-[7px]"
							>+${{ (riskAmountUsd * 2.0).toFixed(2) }}</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
