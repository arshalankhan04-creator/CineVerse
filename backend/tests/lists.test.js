const request = require('supertest');
const app = require('../server');

describe('Custom Lists API', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'listuser',
        email: 'list@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
  });

  it('should create a custom list', async () => {
    const res = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Favs',
        description: 'Best movies ever',
        isPublic: false
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.name).toBe('My Favs');
  });

  it('should add an item to a list', async () => {
    const createRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Action Movies',
      });
    
    const listId = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/lists/${listId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'add',
        item: { tmdbId: 111, mediaType: 'movie', title: 'Action 1' }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].tmdbId).toBe(111);
  });

  it('should remove an item from a list', async () => {
    const createRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Action Movies',
      });
    
    const listId = createRes.body.data._id;

    await request(app)
      .put(`/api/lists/${listId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'add',
        item: { tmdbId: 111, mediaType: 'movie', title: 'Action 1' }
      });

    const res = await request(app)
      .put(`/api/lists/${listId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'remove',
        item: { tmdbId: 111 }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.items.length).toBe(0);
  });

  it('should overwrite list items with an array of items', async () => {
    const createRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sci-Fi Movies',
      });
    
    const listId = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/lists/${listId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { tmdbId: 201, mediaType: 'movie', title: 'Sci-Fi 1' },
          { tmdbId: 202, mediaType: 'movie', title: 'Sci-Fi 2' }
        ]
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.items[0].tmdbId).toBe(201);
    expect(res.body.data.items[1].tmdbId).toBe(202);
    expect(res.body.data.id).toBe(listId);
    expect(res.body.data._id).toBe(listId);
  });

  it('should delete a custom list', async () => {
    const createRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'List to delete',
      });
    
    const listId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/api/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('List deleted');
    expect(res.body.data).toEqual({});
  });
});
