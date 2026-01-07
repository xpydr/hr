<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamInvitation extends Model
{
    /** @use HasFactory<\Database\Factories\TeamInvitationFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'team_id',
        'email',
        'token',
        'otp_code',
        'expires_at',
        'used_at',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the team that the invitation is for.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the user who created the invitation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate a unique token for the invitation.
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (static::where('token', $token)->exists());

        return $token;
    }

    /**
     * Generate a 6-digit OTP code.
     */
    public static function generateOtp(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if the invitation is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the invitation has been used.
     */
    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Check if the invitation is valid (not expired and not used).
     */
    public function isValid(): bool
    {
        return ! $this->isExpired() && ! $this->isUsed();
    }

    /**
     * Scope a query to only include valid invitations.
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
            ->whereNull('used_at');
    }

    /**
     * Scope a query to only include expired invitations.
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Scope a query to only include unused invitations.
     */
    public function scopeUnused($query)
    {
        return $query->whereNull('used_at');
    }
}
