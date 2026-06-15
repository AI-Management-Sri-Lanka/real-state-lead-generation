from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, ForeignKey
from database import Base
from sqlalchemy.orm import relationship
import enum
 
 
class PropertyType(str, enum.Enum):
    apartment = "Apartment"
    house = "House"
    land = "Land"
    commercial = "Commercial"
 
 
class ListingType(str, enum.Enum):
    for_sale = "For Sale"
    for_rent = "For Rent"

class Furnishing(str, enum.Enum):
    unfurnished = "Unfurnished"
    semi_furnished = "Semi-Furnished"
    fully_furnished = "Fully-Furnished"
 
class Property(Base):
    __tablename__ = "properties"
 
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="LKR")
    location = Column(String(255), nullable=False)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
    property_type = Column(Enum(PropertyType), nullable=False)
    listing_type = Column(Enum(ListingType), nullable=False)
    is_verified = Column(Boolean, default=False)
    furnishing = Column(Enum(Furnishing), nullable=True)
    parking = Column(String(255), nullable=True)
    listedBy = Column(String(255), nullable=True)
    description = Column(String(1024), nullable=True)

    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
 
 
class PropertyImage(Base):
    __tablename__ = "property_images"
 
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(512), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
 
    property = relationship("Property", back_populates="images")