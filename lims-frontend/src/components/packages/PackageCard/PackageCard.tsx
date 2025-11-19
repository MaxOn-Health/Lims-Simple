'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package } from '@/types/package.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, TestTube, Eye, Edit, Settings, Trash2, IndianRupee } from 'lucide-react';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';

interface PackageCardProps {
  package: Package;
  onDelete?: (packageId: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onDelete,
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/packages/${pkg.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block"
            >
              {pkg.name}
            </Link>
            {pkg.description && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {pkg.description}
              </p>
            )}
          </div>
          <Badge variant={pkg.isActive ? 'default' : 'secondary'} className="shrink-0">
            {pkg.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</p>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xl font-bold text-foreground truncate">
                {Number(pkg.price).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Validity</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-lg font-semibold text-foreground truncate">
                {pkg.validityDays} days
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
              <TestTube className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Tests</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {pkg.tests?.length || 0} test{pkg.tests?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-muted-foreground">Created</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(pkg.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex-shrink-0">
        <div className="flex flex-wrap gap-2 w-full">
          <Link href={`/packages/${pkg.id}`} className="flex-1 min-w-[70px]">
            <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </Button>
          </Link>
          <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
            <Link href={`/packages/${pkg.id}/edit`} className="flex-1 min-w-[70px]">
              <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
                <Edit className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Edit</span>
              </Button>
            </Link>
            <Link href={`/packages/${pkg.id}/tests`} className="flex-1 min-w-[70px]">
              <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Tests</span>
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(pkg.id)}
                className="flex-1 min-w-[70px] text-destructive hover:text-destructive gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Delete</span>
              </Button>
            )}
          </HasRole>
        </div>
      </CardFooter>
    </Card>
  );
};


