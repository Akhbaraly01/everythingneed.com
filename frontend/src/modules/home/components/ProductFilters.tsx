import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Slider } from "@shared/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/ui/sheet";
import { Filter, Search, X } from "lucide-react";
import { Badge } from "@shared/ui/badge";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priceRange: [number, number];
  onPriceChange: (value: [number, number]) => void;
  minRating: number;
  onRatingChange: (value: number) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ProductFilters = ({
  searchQuery,
  onSearchChange,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onClearFilters,
  activeFiltersCount
}: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const ratingOptions = [
    { value: "0", label: "All Ratings" },
    { value: "3", label: "3+ Stars" },
    { value: "4", label: "4+ Stars" },
    { value: "4.5", label: "4.5+ Stars" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden md:flex gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="All">All Categories</SelectItem>
              {categories.filter(c => c !== "All").map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating.toString()} onValueChange={(v) => onRatingChange(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 px-3 bg-muted rounded-md">
            <Label className="text-sm whitespace-nowrap">Price:</Label>
            <span className="text-sm font-medium">${priceRange[0]} - ${priceRange[1]}</span>
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your product search
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.filter(c => c !== "All").map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select value={minRating.toString()} onValueChange={(v) => onRatingChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => onPriceChange(value as [number, number])}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$0</span>
                  <span>$1000</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}>
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => setIsOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
            </Badge>
          )}
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedCategory}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange("All")} />
            </Badge>
          )}
          {minRating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {minRating}+ Stars
              <X className="h-3 w-3 cursor-pointer" onClick={() => onRatingChange(0)} />
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 1000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ${priceRange[0]} - ${priceRange[1]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onPriceChange([0, 1000])} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
