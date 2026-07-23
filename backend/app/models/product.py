"""
Unified Product DTO Model
FastAPI Backend — Retail AI Portal
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ProductDTO(BaseModel):
    """
    Unified Product Data Transfer Object.
    Ensures complete field naming compatibility between WANDS, Amazon, 
    and frontend components by providing auto-populated alias/fallback fields.
    """
    product_id: str
    product_name: str
    description: Optional[str] = None
    
    # Brand properties
    brand: Optional[str] = None
    brand_name: Optional[str] = None
    
    # Category properties
    category: Optional[str] = None
    category_name: Optional[str] = None
    category_path: Optional[str] = None
    
    # Pricing properties
    price: Optional[float] = None
    actual_price: Optional[float] = None
    discounted_price: Optional[float] = None
    discount_percentage: Optional[float] = 0.0
    
    # Ratings properties
    rating: Optional[float] = 0.0
    average_rating: Optional[float] = 0.0
    avg_rating: Optional[float] = 0.0
    rating_count: int = 0
    review_count: int = 0
    
    # Assets & Links
    image_url: Optional[str] = None
    product_url: Optional[str] = None
    availability_status: Optional[str] = "In Stock"
    
    # Recommendation metadata
    similarity_score: Optional[float] = None
    relevance_score: Optional[float] = None
    reason: Optional[str] = None
    concept: Optional[str] = None
    relationship: Optional[str] = None

    @classmethod
    def from_db_row(cls, row: dict) -> "ProductDTO":
        """
        Builds a standard ProductDTO from a database SQL row dict.
        Applies fallback values and normalizes field mappings.
        """
        # Resolve brand name
        brand_val = row.get("brand") or row.get("brand_name") or "Generic"
        
        # Resolve category fields
        cat_path = row.get("category_path") or row.get("category") or "General"
        # Extract category name as the leaf category from the path (e.g. "Audio | Headphones" -> "Headphones")
        cat_name = row.get("category_name")
        if not cat_name and cat_path:
            cat_name = cat_path.split("|")[-1].strip() if "|" in cat_path else cat_path
            
        # Resolve price
        disc_price = row.get("discounted_price") or row.get("price") or row.get("selling_price")
        act_price = row.get("actual_price") or disc_price or 0.0
        disc_price = disc_price or act_price
        
        # Resolve rating
        avg_rat = row.get("average_rating") or row.get("rating") or row.get("avg_rating") or 0.0
        rat_cnt = row.get("rating_count") or row.get("review_count") or 0
        
        # Resolve image url
        img = row.get("image_url") or row.get("img_link")
        
        # Resolve availability
        avail = row.get("availability_status") or "In Stock"
        
        # Calculate discount percentage if missing
        discount_pct = row.get("discount_percentage")
        if discount_pct is None:
            if act_price and act_price > disc_price:
                discount_pct = round(((act_price - disc_price) / act_price) * 100, 2)
            else:
                discount_pct = 0.0

        # Construct instance with normalized and aliased properties
        return cls(
            product_id=str(row["product_id"]),
            product_name=str(row.get("product_name") or f"Product {row['product_id']}"),
            description=row.get("description") or row.get("about_product") or row.get("attribute_summary") or "",
            brand=brand_val,
            brand_name=brand_val,
            category=cat_path,
            category_name=cat_name,
            category_path=cat_path,
            price=float(disc_price) if disc_price else 0.0,
            actual_price=float(act_price) if act_price else 0.0,
            discounted_price=float(disc_price) if disc_price else 0.0,
            discount_percentage=float(discount_pct),
            rating=float(avg_rat),
            average_rating=float(avg_rat),
            avg_rating=float(avg_rat),
            rating_count=int(rat_cnt),
            review_count=int(rat_cnt),
            image_url=img,
            product_url=row.get("product_url") or row.get("product_link") or "",
            availability_status=avail,
            similarity_score=row.get("similarity_score"),
            relevance_score=row.get("relevance_score") or row.get("similarity_score"),
            reason=row.get("reason"),
            concept=row.get("concept"),
            relationship=row.get("relationship")
        )
