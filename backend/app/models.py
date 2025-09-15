from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
import datetime
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: Optional[str] = Field(index=True) 
    name: Optional[str] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    analyses: List["Analysis"] = Relationship(back_populates="user")
    github_profiles: List["GitHubProfile"] = Relationship(back_populates="user")
class Analysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: Optional[datetime.datetime] = None
    status: str = "pending"
    task_id: Optional[str] = None
    resume_text: Optional[str] = None
    extracted_skills: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    missing_skills: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    result: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))
    error: Optional[str] = None
    user: User = Relationship(back_populates="analyses")
class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    company: str
    description: str
    required_skills: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    salary_range: Optional[str] = None
class GitHubProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    username: str
    repos: Optional[Dict[str, List[str]]] = Field(default_factory=dict, sa_column=Column(JSONB))  # Evidence dict
    last_synced: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)
    user: User = Relationship(back_populates="github_profiles")