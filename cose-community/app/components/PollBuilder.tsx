"use client";
import { useState } from "react";

type Props = {
	namePrefix?: string; // to namespace inputs if multiple on page
};

export function PollBuilder({ namePrefix = "" }: Props) {
	const [options, setOptions] = useState<string[]>(["", ""]);

	function addOption() {
		setOptions((prev) => [...prev, ""]);
	}
	function removeOption(idx: number) {
		setOptions((prev) => prev.filter((_, i) => i !== idx));
	}
	function updateOption(idx: number, value: string) {
		setOptions((prev) => prev.map((v, i) => (i === idx ? value : v)));
	}

	return (
		<div className="space-y-2">
			<div className="text-sm text-gray-700">Options</div>
			{options.map((opt, idx) => (
				<div key={idx} className="flex items-center gap-2">
					<input
						name={`${namePrefix}option_${idx}`}
						value={opt}
						onChange={(e) => updateOption(idx, e.target.value)}
						placeholder={`Option ${idx + 1}`}
						className="border rounded px-3 py-1 flex-1"
					/>
					<button type="button" onClick={() => removeOption(idx)} className="px-2 py-1 border rounded text-xs">Remove</button>
				</div>
			))}
			<div>
				<button type="button" onClick={addOption} className="px-2 py-1 border rounded text-xs">Add option</button>
			</div>
			{/* Hidden textarea aggregate for server action parsing */}
			<textarea name="options" className="hidden" readOnly value={options.filter(Boolean).join("\n")} />
		</div>
	);
}
