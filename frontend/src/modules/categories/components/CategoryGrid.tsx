import { Link } from "react-router-dom";
import { Card } from "@shared/ui/card";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGridProps {
  categories: Category[];
  baseUrl?: string;
}

const CategoryGrid = ({ categories, baseUrl = "" }: CategoryGridProps) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`${baseUrl}/${category.id}`}
          className="group"
        >
          <Card className="aspect-square flex flex-col items-center justify-center p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
            <span className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform">
              {category.icon}
            </span>
            <span className="text-xs md:text-sm font-medium text-center line-clamp-2">
              {category.name}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CategoryGrid;
