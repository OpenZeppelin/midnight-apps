'use client';

import { TradeTabs } from '@/components/trade-tabs';
import { Header } from '@/components/header';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function TradePage() {
	const [initialTokens, setInitialTokens] = useState<{
		fromToken?: string;
		toToken?: string;
		fromTokenType?: string;
		toTokenType?: string;
	} | undefined>(undefined);
	const [searchParams] = useSearchParams();

	useEffect(() => {
		// Read URL parameters for initial tokens
		const fromToken = searchParams.get('fromToken');
		const toToken = searchParams.get('toToken');
		const fromTokenType = searchParams.get('fromTokenType');
		const toTokenType = searchParams.get('toTokenType');

		if (fromToken && toToken) {
			setInitialTokens({
				fromToken: fromToken || undefined,
				toToken: toToken || undefined,
				fromTokenType: fromTokenType || undefined,
				toTokenType: toTokenType || undefined,
			});
		}
	}, [searchParams]);

	return (
		<div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
			<MoonDustBackground />
			<Header />
			<div className="container mx-auto px-3 py-16">
				<div className="mt-4">
					<TradeTabs initialTokens={initialTokens} />
				</div>
			</div>
		</div>
	);
}