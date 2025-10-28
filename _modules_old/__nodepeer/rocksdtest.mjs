/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import levelup from 'levelup';
import rocksdb from 'rocksdb';
import path    from 'path';

const dbPath = path.resolve('./rocksdata');


// Open the database
// The `rocksdb` binding is passed to `levelup` as the factory.
const db = levelup(rocksdb(dbPath));

try {
    console.log('Opening database...');

    // Put a key-value pair
    await db.put('greetings', 'Hello from RocksDB!');
    console.log('Successfully wrote a key-value pair.');

    // Get the value by key
    const value = await db.get('greetings');
    console.log(`The value is: ${value}`);

    // Close the database
    await db.close();
    console.log('Database closed.');

} catch (err) {
    console.error('An error occurred:', err);
}