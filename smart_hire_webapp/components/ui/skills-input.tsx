"use client";

import { X } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { Badge } from "./badge";

interface SkillsInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function SkillsInput({ value, onChange, placeholder, className }: SkillsInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "," || e.key === "Enter") {
            e.preventDefault();
            const trimmedValue = inputValue.trim();
            if (trimmedValue && !value.includes(trimmedValue)) {
                onChange([...value, trimmedValue]);
                setInputValue("");
            }
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeSkill = (skillToRemove: string) => {
        onChange(value.filter((skill) => skill !== skillToRemove));
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-card/50 border border-border rounded-md">
                {value.map((skill) => (
                    <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-muted text-foreground border-border h-7 px-2 flex items-center gap-1"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-foreground transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 bg-transparent border-none outline-none text-foreground text-sm min-w-[120px] placeholder:text-muted-foreground/60"
                />
            </div>
        </div>
    );
}
