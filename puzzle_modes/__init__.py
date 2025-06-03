"""
Truth-Teller/Liar Puzzle Modules

This package contains four difficulty levels of logic puzzles:
- easy_mode: Simple DIRECT statements only
- medium_mode: DIRECT, AND, OR statements  
- hard_mode: DIRECT, AND, OR, IF statements (at least one IF required)
- extreme_mode: All advanced operators including XOR, IFF, NESTED_IF, SELF_REF, GROUP

Each module provides:
- api_generate_<mode>(num_players: int) -> dict
- check_<mode>_solution(data: dict) -> dict

All puzzles use generic labels A, B, C, ... and Z3 for constraint solving.
"""

from .easy_mode import api_generate_easy, check_easy_solution
from .medium_mode import api_generate_medium, check_medium_solution  
from .hard_mode import api_generate_hard, check_hard_solution
from .extreme_mode import api_generate_extreme, check_extreme_solution

__version__ = "1.0.0"
__author__ = "Logic Puzzle Generator"

__all__ = [
    "api_generate_easy", "check_easy_solution",
    "api_generate_medium", "check_medium_solution", 
    "api_generate_hard", "check_hard_solution",
    "api_generate_extreme", "check_extreme_solution"
] 