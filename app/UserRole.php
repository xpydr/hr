<?php

namespace App;

enum UserRole: string
{
    case Admin = 'admin';
    case Hr = 'hr';
    case Employee = 'employee';
}
