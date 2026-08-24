import { useState, useEffect } from "react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Badge } from "@shared/ui/badge";
import { Slider } from "@shared/ui/slider";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { ScrollArea } from "@shared/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@shared/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { 
  Search, SlidersHorizontal, Star, X, Check, 
  ArrowUpDown, Grid, List, Tag 
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FilterState {
  search: string;
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  brands: string[];
  availability: "all" | "in-stock" | "on-sale";
  sortBy: string;
}

interface AdvancedProductFiltersProps {
  categories: string[];
  brands?: string[];
  maxPrice: number;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
}

const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
];

const AdvancedProductFilters = ({
  categories,
  brands = [],
  maxPrice,
  onFilterChange,
  resultCount,
}: AdvancedProductFiltersProps) => {
  const { formatPrice, currency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    priceRange: [0, maxPrice],
    minRating: 0,
    brands: [],
    availability: "all",
    sortBy: "relevance",
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      categories: [],
      priceRange: [0, maxPrice],
      minRating: 0,
      brands: [],
      availability: "all",
      sortBy: "relevance",
    });
  };

  const activeFiltersCount = 
    filters.categories.length +
    filters.brands.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0) +
    (filters.availability !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Sort, View Toggle */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 pr-4"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilter("search", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter("sortBy", value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="hidden md:flex border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-1">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filters
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] pr-4">
              <FilterContent
                filters={filters}
                categories={categories}
                brands={brands}
                maxPrice={maxPrice}
                formatPrice={formatPrice}
                updateFilter={updateFilter}
                toggleCategory={toggleCategory}
                toggleBrand={toggleBrand}
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters Bar */}
      <div className="hidden md:flex gap-2 flex-wrap items-center">
        {/* Quick Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.slice(0, 8).map((category) => (
            <Button
              key={category}
              variant={filters.categories.includes(category) ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => toggleCategory(category)}
            >
              {category}
              {filters.categories.includes(category) && (
                <Check className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>

        {/* Price Range Dropdown */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Tag className="h-4 w-4" />
              Price Range
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="ml-1">
                  {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Price Range</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                min={0}
                max={maxPrice}
                step={10}
              />
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      updateFilter("priceRange", [
                        Number(e.target.value),
                        filters.priceRange[1],
                      ])
                    }
                    className="h-9"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div>
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      updateFilter("priceRange", [
                        filters.priceRange[0],
                        Number(e.target.value),
                      ])
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Rating Filter */}
        <Select
          value={filters.minRating.toString()}
          onValueChange={(value) => updateFilter("minRating", Number(value))}
        >
          <SelectTrigger className="w-36">
            <Star className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Ratings</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
            <SelectItem value="4.8">4.8+ Stars</SelectItem>
          </SelectContent>
        </Select>

        {/* Availability */}
        <Select
          value={filters.availability}
          onValueChange={(value: FilterState["availability"]) =>
            updateFilter("availability", value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="on-sale">On Sale</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear All */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-destructive hover:text-destructive"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Pills */}
      {(filters.categories.length > 0 || filters.brands.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1 pr-1">
              {cat}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleCategory(cat)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.brands.map((brand) => (
            <Badge key={brand} variant="secondary" className="gap-1 pr-1">
              {brand}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleBrand(brand)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {resultCount.toLocaleString()} product{resultCount !== 1 ? "s" : ""} found
      </p>
    </div>
  );
};

// Filter Content Component (for mobile sheet)
const FilterContent = ({
  filters,
  categories,
  brands,
  maxPrice,
  formatPrice,
  updateFilter,
  toggleCategory,
  toggleBrand,
}: {
  filters: FilterState;
  categories: string[];
  brands: string[];
  maxPrice: number;
  formatPrice: (price: number) => string;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleCategory: (category: string) => void;
  toggleBrand: (brand: string) => void;
}) => (
  <Accordion type="multiple" defaultValue={["categories", "price", "rating"]} className="mt-4">
    {/* Categories */}
    <AccordionItem value="categories">
      <AccordionTrigger>Categories</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Price Range */}
    <AccordionItem value="price">
      <AccordionTrigger>Price Range</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
            min={0}
            max={maxPrice}
            step={10}
          />
          <div className="flex justify-between text-sm">
            <span>{formatPrice(filters.priceRange[0])}</span>
            <span>{formatPrice(filters.priceRange[1])}</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Rating */}
    <AccordionItem value="rating">
      <AccordionTrigger>Rating</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {[0, 4, 4.5, 4.8].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.minRating === rating}
                onCheckedChange={() => updateFilter("minRating", rating)}
              />
              <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1 text-sm cursor-pointer">
                {rating === 0 ? (
                  "All Ratings"
                ) : (
                  <>
                    {rating}+
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </>
                )}
              </Label>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* Brands */}
    {brands.length > 0 && (
      <AccordionItem value="brands">
        <AccordionTrigger>Brands</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center gap-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    )}

    {/* Availability */}
    <AccordionItem value="availability">
      <AccordionTrigger>Availability</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {[
            { value: "all", label: "All Items" },
            { value: "in-stock", label: "In Stock Only" },
            { value: "on-sale", label: "On Sale" },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`avail-${option.value}`}
                checked={filters.availability === option.value}
                onCheckedChange={() =>
                  updateFilter("availability", option.value as FilterState["availability"])
                }
              />
              <Label htmlFor={`avail-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default AdvancedProductFilters;
