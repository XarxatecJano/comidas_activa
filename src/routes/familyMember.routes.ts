import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import * as FamilyMemberService from '../services/FamilyMemberService';

type Variables = {
  userId: string;
  userEmail: string;
};

const familyMemberRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const createFamilyMemberSchema = z.object({
  name: z.string().min(1).max(255),
  preferences: z.string().optional(),
  dietary_restrictions: z.string().optional()
});

const updateFamilyMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  preferences: z.string().optional(),
  dietary_restrictions: z.string().optional()
});

// Get all family members for the authenticated user
familyMemberRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const members = await FamilyMemberService.getFamilyMembers(userId);
  return c.json({ members });
});

// Get a specific family member
familyMemberRoutes.get('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  
  const member = await FamilyMemberService.getFamilyMemberById(memberId, userId);
  
  if (!member) {
    return c.json({ error: { message: 'Family member not found', code: 'NOT_FOUND' } }, 404);
  }
  
  return c.json({ member });
});

// Create a new family member
familyMemberRoutes.post('/', authMiddleware, zValidator('json', createFamilyMemberSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  const member = await FamilyMemberService.createFamilyMember(userId, data);
  
  return c.json({ member }, 201);
});

// Update a family member
familyMemberRoutes.put('/:id', authMiddleware, zValidator('json', updateFamilyMemberSchema), async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  const data = c.req.valid('json');
  
  const member = await FamilyMemberService.updateFamilyMember(memberId, userId, data);
  
  if (!member) {
    return c.json({ error: { message: 'Family member not found', code: 'NOT_FOUND' } }, 404);
  }
  
  return c.json({ member });
});

// Delete a family member
familyMemberRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  
  const deleted = await FamilyMemberService.deleteFamilyMember(memberId, userId);
  
  if (!deleted) {
    return c.json({ error: { message: 'Family member not found', code: 'NOT_FOUND' } }, 404);
  }
  
  return c.json({ message: 'Family member deleted successfully' });
});

export default familyMemberRoutes;
