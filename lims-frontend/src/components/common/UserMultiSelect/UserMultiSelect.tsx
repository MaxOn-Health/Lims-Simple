import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User } from '@/types/user.types';

interface UserMultiSelectProps {
    users: User[];
    selectedUserIds: string[];
    onChange: (selectedIds: string[]) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

export const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
    users,
    selectedUserIds,
    onChange,
    placeholder = 'Select users...',
    className,
    label = 'Users',
}) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.fullName.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const handleSelect = (userId: string) => {
        const newSelected = selectedUserIds.includes(userId)
            ? selectedUserIds.filter((id) => id !== userId)
            : [...selectedUserIds, userId];
        onChange(newSelected);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between min-h-[40px] h-auto', className)}
                >
                    <div className="flex flex-wrap gap-1 items-center text-left">
                        {selectedUserIds.length > 0 ? (
                            selectedUserIds.length <= 2 ? (
                                selectedUsers.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="mr-1">
                                        {user.fullName}
                                    </Badge>
                                ))
                            ) : (
                                <>
                                    <Badge variant="secondary" className="mr-1">
                                        {selectedUsers[0].fullName}
                                    </Badge>
                                    <Badge variant="secondary">+{selectedUserIds.length - 1} more</Badge>
                                </>
                            )
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 opacity-50 shrink-0">
                        {selectedUserIds.length > 0 && (
                            <X
                                className="h-4 w-4 hover:opacity-100 transition-opacity z-10"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronsUpDown className="h-4 w-4" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-0" align="start">
                <DropdownMenuLabel className="px-2 py-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${label}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[200px] overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <DropdownMenuCheckboxItem
                                key={user.id}
                                checked={selectedUserIds.includes(user.id)}
                                onCheckedChange={() => handleSelect(user.id)}
                                className="cursor-pointer"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </DropdownMenuCheckboxItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
