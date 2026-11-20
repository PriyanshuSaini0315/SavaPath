import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "volunteer" or "organisation"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    volunteer_profile = relationship("VolunteerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    organisation_profile = relationship("OrganisationProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class VolunteerProfile(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    contact = Column(String(100), nullable=True)
    interests = Column(JSON, default=list)  # ["Food Relief", "Education"]
    skills = Column(JSON, default=list)  # ["Cooking", "Logistics"]
    experience_level = Column(String(50), default="beginner")  # "beginner", "some", "experienced"
    availability = Column(JSON, default=lambda: {"days": [], "hours": []})  # {"days": ["Sunday"], "hours": ["Morning"]}
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    neighbourhood_name = Column(String(255), nullable=False)
    max_distance_km = Column(Float, default=10.0)
    willingness_to_learn = Column(Boolean, default=True)

    user = relationship("User", back_populates="volunteer_profile")
    applications = relationship("Application", back_populates="volunteer", cascade="all, delete-orphan")


class OrganisationProfile(Base):
    __tablename__ = "organisations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    org_name = Column(String(255), nullable=False)
    contact = Column(String(100), nullable=True)
    location_city = Column(String(100), default="Lucknow")
    description = Column(Text, nullable=True)

    user = relationship("User", back_populates="organisation_profile")
    missions = relationship("Mission", back_populates="organisation", cascade="all, delete-orphan")


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    cause = Column(String(100), nullable=False)  # e.g. "Food Relief", "Education"
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    time_slot = Column(String(100), nullable=False)  # e.g. "Morning", "Afternoon", "09:00 - 13:00"
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    neighbourhood_name = Column(String(255), nullable=False)
    city = Column(String(100), default="Lucknow")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organisation = relationship("OrganisationProfile", back_populates="missions")
    roles = relationship("MissionRole", back_populates="mission", cascade="all, delete-orphan")


class MissionRole(Base):
    __tablename__ = "mission_roles"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id", ondelete="CASCADE"), nullable=False)
    role_name = Column(String(255), nullable=False)
    required_skills = Column(JSON, default=list)  # ["Cooking", "First Aid"]
    people_needed = Column(Integer, default=1)
    beginner_friendly = Column(Boolean, default=False)

    mission = relationship("Mission", back_populates="roles")
    applications = relationship("Application", back_populates="role", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    mission_role_id = Column(Integer, ForeignKey("mission_roles.id", ondelete="CASCADE"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="applied")  # applied, invited, selected_primary, selected_backup, not_selected
    match_score = Column(Float, default=0.0)
    score_breakdown = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    role = relationship("MissionRole", back_populates="applications")
    volunteer = relationship("VolunteerProfile", back_populates="applications")

