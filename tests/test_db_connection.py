import mysql.connector

# 1. Establish the Connection
try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
<<<<<<< HEAD
        password="mazen2004",
=======
        password="ali2005",
>>>>>>> 2f8b3c7c4f9e9ed46a4bccf498ed0f5c86fa730b
        database="AIPMS"
    )

    print(f"Connection Status: {conn.is_connected()}") # Should print True

    if conn.is_connected():
        cursor = conn.cursor()
        sql_query = "SELECT * from userr"
        print(f"\nExecuting Query: {sql_query}")
        cursor.execute(sql_query)
        results = cursor.fetchall()

        if results:
            print("\n--- Results ---")
            column_names = [i[0] for i in cursor.description]
            print(f"Columns: {column_names}")
            for row in results:
                print(row)
        else:
            print("Query executed successfully, but returned 0 rows (the table is empty or the criteria matched nothing).")

except mysql.connector.Error as err:
    print(f"\nError: {err}")

finally:
    if 'cursor' in locals() and cursor is not None:
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
        print("\nConnection closed.")