# Email Templates for Euro Lottery

This directory contains the email templates used for all automated notifications in the Euro Lottery system. The templates use Django's template language and support full HTML formatting.

## Structure

- `emails/`: Contains all email templates
  - `base_email.html`: Base template that all other templates extend
  - Template files follow the naming convention: `notification_type.html`

## How Templates Work

1. All email templates extend the `base_email.html` template
2. The notification system selects the appropriate template based on the notification type
3. Templates receive a context that includes:
   - `user`: The user object
   - `notification`: The notification object
   - `notification.data`: Custom data specific to the notification type
   - `site_name`, `site_url`, `current_year`, etc: Global context variables

## Available Notification Types

The following notification types have templates:

1. `welcome`: Sent when a user registers for the first time
2. `draw_upcoming`: Reminds users of upcoming lottery draws
3. `draw_results`: Sent after a draw with the results
4. `winning`: Notifies users about winning tickets
5. `deposit_success`: Confirms successful deposits
6. `deposit_failed`: Informs about failed deposit attempts
7. `withdrawal_approved`: Notifies that a withdrawal was approved
8. `withdrawal_processed`: Confirms a completed withdrawal
9. `withdrawal_failed`: Informs about failed withdrawal attempts
10. `ticket_purchased`: Confirms ticket purchases
11. `promo`: Promotional emails
12. `system`: System notifications

## Template Context Variables

### Common Variables

- `user`: The User object (access via `user.username`, `user.email`, etc.)
- `notification`: The Notification object
- `notification.title`: The notification title
- `notification.message`: The notification message
- `site_name`: The name of the site (default: "Euro Lottery")
- `site_url`: The URL of the site
- `current_year`: The current year (for copyright notices)
- `support_email`: Support email address

### Custom Data Variables

Each notification type includes specific data in `notification.data`. Below are common data fields:

#### Draw Notifications
- `lottery_name`: Name of the lottery
- `draw_number`: Draw number/ID
- `draw_date`: Date and time of the draw
- `jackpot_amount`: Current jackpot amount
- `main_numbers`: List of drawn main numbers
- `extra_numbers`: List of drawn extra/bonus numbers

#### Transaction Notifications
- `amount`: Transaction amount
- `transaction_id`: Unique transaction ID
- `provider`: Payment provider (for deposits)
- `payment_method`: Payment method (for withdrawals)

## How to Add a New Template

1. Create a new HTML file in the `emails/` directory with the notification type name
2. Extend the base template with `{% extends "emails/base_email.html" %}`
3. Add your content within the content block: `{% block content %}...{% endblock %}`
4. Use variables from the context with Django template syntax: `{{ variable }}`

## Testing Email Templates

To test how emails look:

1. Create a notification with the appropriate type and data
2. Use the Django shell to render the template:
   ```python
   from django.template.loader import render_to_string
   from users.models import User, Notification
   
   user = User.objects.get(email='test@example.com')
   notification = Notification.objects.get(id=1)  # Replace with actual ID
   
   context = {
       'user': user,
       'notification': notification,
       'site_name': 'Euro Lottery',
       'site_url': 'https://eurolottery.example.com',
       'current_year': 2025,
   }
   
   # Add notification data to context
   context.update(notification.data)
   
   # Render template
   html = render_to_string(f'emails/{notification.notification_type}.html', context)
   
   # Write to file for viewing
   with open('test_email.html', 'w') as f:
       f.write(html)
   ```
3. Open the generated HTML file in a browser