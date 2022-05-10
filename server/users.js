const users = [];

const addUser = ({ id, name, type, room }) => {
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();
  // FIXME: the existingUser is not working properly
  const existingUser = users.find((user) => {
    user.room === room && user.name === name;
  });
  if (existingUser) {
    return { error: "Username is taken" };
  }
  const user = { id, name, type, room };

  !existingUser && users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => {
    user.id === id;
  });

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => users.find((user) => user.id === id);
const getPatient = () => users.find((user) => user.type === "patient");
const getDetector = () => users.find((user) => user.type === "detector");
const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = {
  users,

  addUser,
  removeUser,
  getUser,
  getPatient,
  getDetector,
  getUsersInRoom,
};
