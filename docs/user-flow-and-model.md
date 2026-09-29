# User Flow and Model

## User Flow

### Registration

1. The user enters their phone number, birthdate, and gender.
2. The system validates the information and sends an OTP to the phone number.
3. The user enters the OTP.
4. If the OTP is correct, the account is created with the `free` account level.
5. The user is immediately logged in and can use the application.

```text
Enter phone number, birthdate, and gender
                    ↓
              Receive OTP
                    ↓
               Enter OTP
                    ↓
             Account created
                    ↓
           Logged in automatically
```

If the phone number already belongs to an account, the user must use the login
flow instead. An invalid or expired OTP does not create an account.

### Login

1. The user enters their phone number.
2. The system sends an OTP to the phone number.
3. The user enters the OTP.
4. If the OTP is correct and the account exists and is active, the user is
   logged in.

```text
Enter phone number
        ↓
   Receive OTP
        ↓
    Enter OTP
        ↓
     Logged in
```

Login never uses an email address or password. A valid OTP cannot create an
account through the login flow; new users must complete registration.

### Session Refresh and Logout

Successful registration and login return an access credential and an opaque refresh
credential. The client stores the refresh credential securely and
uses it to restore the session without requesting another OTP.

Every refresh consumes the current refresh credential and returns a replacement.
Reusing a consumed, expired, or logged-out refresh credential fails. Logging out
invalidates the supplied refresh credential; an access credential already issued to
the client expires normally.

### Profile Completion and Editing

After registration, the user may add or update:

- Username
- Email address
- Birthdate
- Gender
- Avatar

The phone number identifies the account and cannot be changed through normal
profile editing. Changing it requires a separate phone-number verification flow.

The account level is visible on the profile but cannot be changed directly by
the user. It is managed by the application's subscription or entitlement flow.

### Account Deletion

1. The authenticated user chooses to delete their account.
2. The application should ask for explicit confirmation.
3. After confirmation, the account and its owned data are permanently deleted.
4. The current session becomes invalid and the user returns to the unauthenticated
   experience.

Account deletion is permanent. Registering again with the same phone number
creates a new account rather than restoring the deleted account.

## User Model

| Field | Required | Editable by user | Description |
| --- | --- | --- | --- |
| `id` | Yes | No | Unique internal account identifier. |
| `phone_number` | Yes | No | Unique verified Iranian mobile number in international format. |
| `username` | No | Yes | Unique, normalized username between 3 and 50 characters. |
| `email` | No | Yes | Unique optional email address stored in lowercase. It is not used for login. |
| `birthdate` | Yes | Yes | User's date of birth. Future dates are not allowed. |
| `gender` | Yes | Yes | User-selected gender value. |
| `account_level` | Yes | No | Account entitlement level. Defaults to `free`. |
| `avatar` | No | Yes | Reference to the user's profile image. |
| `is_active` | Yes | No | Internal flag controlling whether the account may authenticate. |
| `created_at` | Yes | No | Time when the account was created. |
| `updated_at` | Yes | No | Time when the profile was last updated. |

### Gender Values

- `male`
- `female`
- `other`
- `prefer_not_to_say`

### Account Levels

- `free` — Default level for every newly registered account.
- `pro` — Paid or otherwise entitled account level.

### Model Rules

- Every account has one unique, verified phone number.
- A phone number cannot belong to more than one account.
- Username and email are optional, but each must be unique when provided.
- Birthdate and gender are required during registration.
- Email and password are never used for authentication.
- Users cannot directly change their account level or active status.
- Deleted accounts and their owned data are not recoverable through login.


### Dev OTP

`11111`
