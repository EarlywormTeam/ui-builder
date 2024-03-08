const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const InvitationCodeModel = require('../services/db/models/invitationCode');
const UserModel = require('../services/db/models/user');
const WaitlistUserModel = require('../services/db/models/waitlistUser');

async function addToWaitlist(ctx) {
  const { email } = ctx.request.body;
  if (!email || typeof email !== 'string') {
    ctx.status = 400;
    ctx.body = { message: 'Invalid email' };
    return;
  }

  try {
    const waitlistUser = new WaitlistUserModel({ email });
    await waitlistUser.save();
  } catch (error) {
    console.error('Failed to add user to waitlist:', error);
    ctx.status = 500;
    return;
  }

  ctx.status = 201;
  ctx.body = { message: 'Added to waitlist' };
}

async function validateInvite(ctx) {
  const { invitationCode } = ctx.request.body;
  if (!invitationCode || typeof invitationCode !== 'string') {
    ctx.status = 400;
    ctx.body = { message: 'Invalid input' };
    return;
  }

  const user = await UserModel.findOne({
    'identity.id': ctx.request.headers['x-ms-client-principal-id'],
    'identity.name': ctx.request.headers['x-ms-client-principal-name'],
    provider: ctx.request.headers['x-ms-client-principal-idp']
  });
  if (!user) {
    ctx.status = 401;
    ctx.body = { message: 'Unauthorized' };
    return;
  }

  const codeModel = await InvitationCodeModel.findOne({ code: invitationCode });
  if (!codeModel) {
    ctx.status = 403;
    ctx.body = { message: 'Invalid invitation code' };
    return;
  }
  if (codeModel.uses >= codeModel.maxUses) {
    ctx.status = 403;
    ctx.body = { message: 'Invitation code has been used too many times' };
    return;
  }

  user.inviteCode = codeModel._id;
  user.activated = true;
  await user.save();

  codeModel.uses++;
  await codeModel.save();

  ctx.status = 200;
  ctx.body = { message: 'Valid invitation code' };
}

async function signIn(ctx) {
  const identityId = ctx.request.headers['x-ms-client-principal-id'];
  const identityName = ctx.request.headers['x-ms-client-principal-name'];
  const provider = ctx.request.headers['x-ms-client-principal-idp'];

  if (!identityId || !identityName || !provider) {
    ctx.status = 401;
    ctx.body = { message: 'Unauthorized' };
    return;
  }

  // Log the sign in in the db and return whether an invitation code is required.
  const userModel = await UserModel.findOneAndUpdate(
    { 
      'identity.id': identityId, 
      'identity.name': identityName, 
      provider: provider 
    },
    {},
    { upsert: true, new: true }
  );

  ctx.status = 200;
  
  hash.update(`${userModel._id}QCKFX_SPECIAL_SALT`);
  ctx.body = { invitationRequired: !userModel.inviteCode, userId: hash.digest('hex') };
}

module.exports = { addToWaitlist, validateInvite, signIn };