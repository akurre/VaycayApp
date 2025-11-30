import { objectType, mutationType, nonNull, stringArg } from 'nexus';
import nodemailer from 'nodemailer';

// Feedback Type
export const Feedback = objectType({
  name: 'Feedback',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
  },
});

// Send Feedback Mutation
export const sendFeedbackMutation = mutationType({
  definition(t) {
    t.field('sendFeedback', {
      type: Feedback,
      args: {
        email: stringArg(),
        name: nonNull(stringArg()),
        currentIssues: stringArg(),
        futureIdeas: stringArg(),
      },
      async resolve(_parent, args) {
        try {
          // Create transporter using Gmail
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
          });

          // Email options
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'feedbackforash@gmail.com',
            subject: 'Vaycay App Feedback',
            text: `
Feedback received from: ${args.name}${args.email ? ` (${args.email})` : ''}

${args.currentIssues ? `Current Issues/Feedback:\n${args.currentIssues}\n` : ''}
${args.futureIdeas ? `Future Ideas:\n${args.futureIdeas}` : ''}
            `.trim(),
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Vaycay App Feedback</h2>
                <p><strong>From:</strong> ${args.name}${args.email ? ` (${args.email})` : ''}</p>
                <hr />
                ${args.currentIssues ? `<p><strong>Current Issues/Feedback:</strong></p><p>${args.currentIssues.replace(/\n/g, '<br>')}</p>` : ''}
                ${args.futureIdeas ? `<p><strong>Future Ideas:</strong></p><p>${args.futureIdeas.replace(/\n/g, '<br>')}</p>` : ''}
              </div>
            `,
          };

          // Send email
          await transporter.sendMail(mailOptions);

          return {
            success: true,
            message: 'Feedback sent successfully',
          };
        } catch (error) {
          console.error('Error sending feedback email:', error);
          return {
            success: false,
            message: 'Failed to send feedback',
          };
        }
      },
    });
  },
});
